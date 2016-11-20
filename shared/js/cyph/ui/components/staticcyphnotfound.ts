import {
	Directive,
	DoCheck,
	ElementRef,
	Inject,
	Injector,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges
} from '@angular/core';
import {UpgradeComponent} from '@angular/upgrade/static';
import {Util} from '../../util';
import {Templates} from '../templates';


/**
 * Angular component for the cyph not found screen.
 */
@Directive({
	selector: 'cyph-static-cyph-not-found'
})
export class StaticCyphNotFound
	extends UpgradeComponent implements DoCheck, OnChanges, OnInit, OnDestroy {
	/** Component title. */
	public static title: string	= 'cyphStaticCyphNotFound';

	/** Component configuration. */
	public static config		= {
		controller: class {
			/** @ignore */
			public Cyph: any;

			/** @ignore */
			public ui: any;

			constructor () { (async () => {
				while (!self['Cyph'] || !self['ui']) {
					await Util.sleep();
				}

				this.Cyph	= self['Cyph'];
				this.ui		= self['ui'];
			})(); }
		},
		template: Templates.staticCyphNotFound
	};


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
		super(StaticCyphNotFound.title, elementRef, injector);
	}
}
