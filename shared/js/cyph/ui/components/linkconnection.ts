import {
	Directive,
	DoCheck,
	ElementRef,
	Inject,
	Injector,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges
} from '@angular/core';
import {UpgradeComponent} from '@angular/upgrade/static';
import {Util} from '../../util';
import {ILinkConnection} from '../ilinkconnection';
import {Templates} from '../templates';


/**
 * Angular component for link connection.
 */
@Directive({
	selector: 'cyph-link-connection'
})
export class LinkConnection
	extends UpgradeComponent implements DoCheck, OnChanges, OnInit, OnDestroy {
	/** Component title. */
	public static title: string	= 'cyphLinkConnection';

	/** Component configuration. */
	public static config		= {
		bindings: {
			self: '<'
		},
		controller: class {
			/** @ignore */
			public Cyph: any;

			/** @ignore */
			public self: ILinkConnection;

			/** @ignore */
			public queuedMessageDraft: string	= '';

			constructor () { (async () => {
				while (!self['Cyph']) {
					await Util.sleep();
				}

				this.Cyph	= self['Cyph'];
			})(); }
		},
		template: Templates.linkConnection
	};


	/** @ignore */
	@Input() public self: ILinkConnection;

	/** @ignore */
	public ngDoCheck () : void {
		super.ngDoCheck();
	}

	/** @ignore */
	public ngOnChanges (changes: SimpleChanges) : void {
		super.ngOnChanges(changes);
	}

	/** @ignore */
	public ngOnDestroy () : void {
		super.ngOnDestroy();
	}

	/** @ignore */
	public ngOnInit () : void {
		super.ngOnInit();
	}

	constructor (
		@Inject(ElementRef) elementRef: ElementRef,
		@Inject(Injector) injector: Injector
	) {
		super(LinkConnection.title, elementRef, injector);
	}
}
