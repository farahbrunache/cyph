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
import {ISignupForm} from '../isignupform';


/**
 * Angular component for signup form.
 */
@Directive({
	/* tslint:disable-next-line:directive-selector */
	selector: 'cyph-signup-form'
})
export class SignupForm
	extends UpgradeComponent implements DoCheck, OnChanges, OnInit, OnDestroy {
	/** Component title. */
	public static readonly title: string	= 'cyphSignupForm';

	/** Component configuration. */
	public static readonly config			= {
		bindings: {
			invite: '<',
			self: '<'
		},
		/* tslint:disable-next-line:max-classes-per-file */
		controller: class {
			/** @ignore */
			public cyph: any;

			/** @ignore */
			public readonly self: ISignupForm;

			/** @ignore */
			public readonly invite: string;

			constructor () { (async () => {
				while (!cyph) {
					await Util.sleep();
				}

				this.cyph	= cyph;
			})(); }
		},
		templateUrl: '../../../../templates/signupform.html',
		transclude: true
	};


	/** @ignore */
	@Input() public self: ISignupForm;

	/** @ignore */
	@Input() public invite: string;

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
		super(SignupForm.title, elementRef, injector);
	}
}
