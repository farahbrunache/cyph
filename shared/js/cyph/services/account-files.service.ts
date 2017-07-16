import {Injectable} from '@angular/core';
import {SafeUrl} from '@angular/platform-browser';
import {Observable} from 'rxjs';
import {AccountFileRecord, IAccountFileRecord} from '../../proto';
import {BinaryProto, BlobProto, DataURIProto, StringProto} from '../protos';
import {util} from '../util';
import {AccountDatabaseService} from './crypto/account-database.service';
import {PotassiumService} from './crypto/potassium.service';


/**
 * Account file service.
 */
@Injectable()
export class AccountFilesService {
	/** @ignore */
	private readonly noteSnippets: Map<string, string>	= new Map<string, string>();

	/** List of file records owned by current user, sorted by timestamp in descending order. */
	public readonly filesList: Observable<IAccountFileRecord[]>	= util.flattenObservablePromise(
		this.accountDatabaseService.watchList<IAccountFileRecord>(
			'fileRecords',
			AccountFileRecord
		).map(records =>
			records.
				map(({value}) => value).
				sort((a, b) => b.timestamp - a.timestamp)
		),
		[]
	);

	/**
	 * Files filtered by record type.
	 * @see files
	 */
	public readonly filteredFiles	= {
		files: this.filterFiles(AccountFileRecord.RecordTypes.File),
		notes: this.filterFiles(AccountFileRecord.RecordTypes.Note)
	};

	/** @ignore */
	private filterFiles (
		filterRecordTypes: AccountFileRecord.RecordTypes
	) : Observable<IAccountFileRecord[]> {
		return util.flattenObservablePromise(
			this.filesList.map(files => files.filter(({recordType}) =>
				!filterRecordTypes || recordType === filterRecordTypes
			)),
			[]
		);
	}

	/** Downloads and saves file. */
	public downloadAndSave (id: string) : {
		progress: Observable<number>;
		result: Promise<void>;
	} {
		const {progress, result}	= this.accountDatabaseService.downloadItem(
			`files/${id}`,
			BinaryProto
		);

		return {
			progress,
			result: (async () => {
				const file	= await this.getFile(id);

				await util.saveFile(
					(await result).value,
					file.name,
					file.mediaType
				);
			})()
		};
	}

	/** Downloads file and returns text. */
	public downloadText (id: string) : {
		progress: Observable<number>;
		result: Promise<string>;
	} {
		const {progress, result}	=
			this.accountDatabaseService.downloadItem(`files/${id}`, StringProto)
		;
		return {progress, result: (async () => (await result).value)()};
	}

	/** Downloads file and returns as data URI. */
	public downloadURI (id: string) : {
		progress: Observable<number>;
		result: Promise<SafeUrl|string|undefined>;
	} {
		const {progress, result}	=
			this.accountDatabaseService.downloadItem(`files/${id}`, DataURIProto)
		;
		return {progress, result: (async () => (await result).value)()};
	}

	/** Gets the specified file record. */
	public async getFile (
		id: string,
		recordType?: AccountFileRecord.RecordTypes
	) : Promise<IAccountFileRecord> {
		const file	= await this.accountDatabaseService.getItem(
			`fileRecords/${id}`,
			AccountFileRecord
		);

		if (recordType !== undefined && file.recordType !== recordType) {
			throw new Error('Specified file does not exist.');
		}

		return file;
	}

	/** Gets the Material icon name for the file default thumbnail. */
	public getThumbnail (mediaType: string) : 'insert_drive_file'|'movie'|'photo' {
		const typeCategory	= mediaType.split('/')[0];

		switch (typeCategory) {
			case 'image':
				return 'photo';

			case 'video':
				return 'movie';

			default:
				return 'insert_drive_file';
		}
	}

	/** Returns a snippet of a note to use as a preview. */
	public noteSnippet (id: string) : string {
		if (!this.noteSnippets.has(id)) {
			this.noteSnippets.set(id, '...');

			(async () => {
				const limit		= 75;
				const content	= await this.downloadText(id).result;

				this.noteSnippets.set(
					id,
					content.length > limit ?
						`${content.substr(0, limit)}...` :
						content
				);
			})();
		}

		return this.noteSnippets.get(id) || '';
	}

	/** Overwrites an existing note. */
	public async updateNote (id: string, content: string) : Promise<void> {
		const file		= await this.getFile(id, AccountFileRecord.RecordTypes.Note);
		file.size		= this.potassiumService.fromString(content).length;
		file.timestamp	= await util.timestamp();

		await Promise.all([
			this.accountDatabaseService.setItem(`files/${id}`, StringProto, content),
			this.accountDatabaseService.setItem(`fileRecords/${id}`, AccountFileRecord, file)
		]);
	}

	/** Uploads new file. */
	public upload (name: string, file: string|File) : {
		progress: Observable<number>;
		result: Promise<void>;
	} {
		const id	= util.uuid();
		const url	= `files/${id}`;

		const {progress, result}	= typeof file === 'string' ?
			this.accountDatabaseService.uploadItem(url, StringProto, file) :
			this.accountDatabaseService.uploadItem(url, BlobProto, file)
		;

		return {
			progress,
			result: result.then(async () => { await this.accountDatabaseService.setItem(
				`fileRecords/${id}`,
				AccountFileRecord,
				{
					id,
					mediaType: typeof file === 'string' ?
						'text/plain' :
						file.type
					,
					name,
					recordType: typeof file === 'string' ?
						AccountFileRecord.RecordTypes.Note :
						AccountFileRecord.RecordTypes.File
					,
					size: typeof file === 'string' ?
						this.potassiumService.fromString(file).length :
						file.size
					,
					timestamp: await util.timestamp()
				}
			); })
		};
	}

	constructor (
		/** @ignore */
		private readonly accountDatabaseService: AccountDatabaseService,

		/** @ignore */
		private readonly potassiumService: PotassiumService
	) {}
}
