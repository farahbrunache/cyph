import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {env} from '../../env';
import {util} from '../../util';
import {VisibilityWatcherService} from './visibility-watcher.service';


/**
 * Manages scrolling and scroll-detection.
 */
@Injectable()
export class ScrollService {
	/** @ignore */
	private rootElement: JQuery|undefined;

	/** @ignore */
	private itemCountInTitle: boolean			= false;

	/** @ignore */
	private scrollDownLock: {}					= {};

	/** @ignore */
	private unreadItems: Set<{unread: boolean}>	= new Set<{unread: boolean}>();

	/** @ignore */
	private appeared ($elem: JQuery) : boolean {
		if (!this.rootElement) {
			return false;
		}

		const offset	= $elem.offset();
		return offset.top > 0 && offset.top < this.rootElement.height();
	}

	/** @ignore */
	private updateTitle () : void {
		if (!this.itemCountInTitle) {
			return;
		}

		this.titleService.setTitle(
			(this.unreadItemCount > 0 ? `(${this.unreadItems}) ` : '') +
			this.titleService.getTitle().replace(/^\(\d+\) /, '')
		);
	}

	/** Initialise service. */
	public init (rootElement: JQuery, itemCountInTitle: boolean = false) : void {
		this.rootElement		= rootElement;
		this.itemCountInTitle	= itemCountInTitle;

		this.updateNanoScroller();

		/* Workaround for jQuery appear plugin */
		const $window	= $(window);
		this.rootElement.scroll(() => $window.trigger('scroll'));
	}

	/** Scrolls to bottom. */
	public async scrollDown () : Promise<void> {
		return util.lockTryOnce(this.scrollDownLock, async () => {
			while (!this.rootElement) {
				await util.sleep();
			}

			await util.sleep();

			await this.rootElement.animate(
				{scrollTop: this.rootElement[0].scrollHeight},
				350
			).promise();

			for (const item of this.unreadItems) {
				item.unread	= false;
			}
			this.unreadItems.clear();
			this.updateTitle();
		});
	}

	/** Process read-ness and scrolling. */
	public async trackItem (item: {unread: boolean}, $elem: JQuery) : Promise<void> {
		while (!this.rootElement) {
			await util.sleep();
		}

		this.updateNanoScroller();

		this.unreadItems.add(item);

		if (!this.visibilityWatcherService.isVisible) {
			this.updateTitle();
			await this.visibilityWatcherService.waitForChange();
		}

		const scrollPosition	=
			this.rootElement[0].scrollHeight -
			(
				this.rootElement[0].scrollTop +
				this.rootElement[0].clientHeight
			)
		;

		if (($elem.height() + 150) > scrollPosition) {
			this.scrollDown();
			return;
		}

		this.updateTitle();
		while (!this.appeared($elem)) {
			await util.sleep();
		}

		item.unread	= false;
		this.unreadItems.delete(item);
		this.updateTitle();
	}

	/** Number of items that haven't appeared in viewport. */
	public get unreadItemCount () : number {
		return this.unreadItems.size;
	}

	/**
	 * Handles macOS-style scrollbars (generally intended for use
	 * only when the scrollbar explicitly needs to be auto-hidden).
	 */
	public updateNanoScroller () : void {
		if (env.isMobile || env.isMacOS || !env.isWeb) {
			return;
		}

		(<any> $('.nano')).nanoScroller();
	}

	constructor (
		/** @ignore */
		private readonly titleService: Title,

		/** @ignore */
		private readonly visibilityWatcherService: VisibilityWatcherService
	) {}
}
