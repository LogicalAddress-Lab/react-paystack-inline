import React from 'react';

let scriptLoading = false;
let scriptLoaded = false;
let scriptDidError = false;

export default class ReactPaystackInline extends React.Component {
    static defaultProps = {
        className: 'PaystackInline',
        label: 'Pay With Card',
        ComponentClass: 'span',
        triggerEvent: 'onClick',
        reconfigureOnUpdate: true,
        lazy: false,
        formId: null,
    }

    static propTypes = {

        triggerEvent: React.PropTypes.oneOf([
            'onClick',
            'onTouchTap',
            'onTouchStart',
        ]),

        // If included, will render the default blue button with label text.
        // (Requires including stripe-checkout.css or adding the .styl file
        // to your pipeline)
        label: React.PropTypes.string,

        // Prevents any events from opening the popup
        // Adds the disabled prop to the button and adjusts the styling as well
        disabled: React.PropTypes.bool,

        // Named component to wrap button (eg. div)
        ComponentClass: React.PropTypes.string,

        // Run this method when the scrupt fails to load. Will run if the internet
        // connection is offline when attemting to load the script.
        onScriptError: React.PropTypes.func,

        // Runs when the script tag is created, but before it is added to the DOM
        onScriptTagCreated: React.PropTypes.func,

        // By default, any time the React component is updated, it will call
        // PaystackPop.setup(paystackParams), which may result in additional XHR calls to the
        // paystack API.  If you know the first configuration is all you need, you
        // can set this to false.  Subsequent updates will affect the PaystackPop.setup(paystackParams);
        // (e.g. different prices)
        reconfigureOnUpdate: React.PropTypes.bool,

        lazy: React.PropTypes.bool,

        // =====================================================
        // Required by paystack
        // see paystack docs for more info:
        //   https://developers.paystack.co/docs/paystack-inline
        // =====================================================

        // Your publishable key (test or live).
        // can't use "key" as a prop in react, so have to change the keyname
        paystackKey: React.PropTypes.string.isRequired,

        // The callback to invoke when the Checkout process is complete.
        //   function(token)
        //     token is the token object created.
        //     token.id can be used to create a charge or customer.
        //     token.email contains the email address entered by the user.
        callback: React.PropTypes.func.isRequired,

        // The amount (in cents) that's shown to the user. Note that you will still
        // have to explicitly include it when you create a charge using the API.
        amount: React.PropTypes.number,

        metadata: React.PropTypes.object,
        // Specify whether Checkout should validate the billing ZIP code (true or
        // false). The default is false.
        email: React.PropTypes.string,

        ref: React.PropTypes.string.isRequired,

        currency: React.PropTypes.string,

        plan: React.PropTypes.string,

        quantity: React.PropTypes.number,

        'data-custom-button': React.PropTypes.string,

        subaccount: React.PropTypes.string,

        transaction_charge: React.PropTypes.number, //integer actually.

        bearer: React.PropTypes.string,

        formId: React.PropTypes.string,

        // function() The callback to invoke when Checkout is closed (not supported
        // in IE6 and IE7).
        onClose: React.PropTypes.func,
    }

    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        if (scriptLoaded) {
            return;
        }

        if (scriptLoading) {
            return;
        }

        scriptLoading = true;
        if (this.props.lazy && this.props.formId != null) {
            this.loadLazyPaystack();
        } else {
            this.loadHardWorking();
        }
    }

    loadLazyPaystack() {
        //still a work in progress. don't use lazy mode.
        const script = document.createElement('script');
        if (typeof this.props.onScriptTagCreated === 'function') {
            this.props.onScriptTagCreated(script);
        }

        script.src = 'https://js.paystack.co/v1/inline.js';
        script.setAttribute("data-key", this.props.paystackKey);
        script.setAttribute("data-email", this.props.email);
        script.setAttribute("data-amount", this.props.amount || 0);
        script.setAttribute("data-ref", this.props.ref);
        script.async = 1;

        this.loadPromise = (() => {
            let canceled = false;
            const promise = new Promise((resolve, reject) => {
                script.onload = () => {
                    scriptLoaded = true;
                    scriptLoading = false;
                    resolve();
                    this.onScriptLoaded();
                };
                script.onerror = (event) => {
                    scriptDidError = true;
                    scriptLoading = false;
                    reject(event);
                    this.onScriptError(event);
                };
            });
            const wrappedPromise = new Promise((accept, cancel) => {
                promise.then(() => canceled ? cancel({
                    isCanceled: true
                }) : accept()); // eslint-disable-line no-confusing-arrow
                promise.catch(error => canceled ? cancel({
                    isCanceled: true
                }) : cancel(error)); // eslint-disable-line no-confusing-arrow
            });

            return {
                promise: wrappedPromise,
                cancel() {
                    canceled = true;
                },
            };
        })();

        this.loadPromise.promise
            .then(this.onScriptLoaded)
            .catch(this.onScriptError);

        document.getElementById(this.props.formId).appendChild(script);
    }

    loadHardWorking() {
        const script = document.createElement('script');
        if (typeof this.props.onScriptTagCreated === 'function') {
            this.props.onScriptTagCreated(script);
        }

        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = 1;

        this.loadPromise = (() => {
            let canceled = false;
            const promise = new Promise((resolve, reject) => {
                script.onload = () => {
                    scriptLoaded = true;
                    scriptLoading = false;
                    resolve();
                    this.onScriptLoaded();
                };
                script.onerror = (event) => {
                    scriptDidError = true;
                    scriptLoading = false;
                    reject(event);
                    this.onScriptError(event);
                };
            });
            const wrappedPromise = new Promise((accept, cancel) => {
                promise.then(() => canceled ? cancel({
                    isCanceled: true
                }) : accept()); // eslint-disable-line no-confusing-arrow
                promise.catch(error => canceled ? cancel({
                    isCanceled: true
                }) : cancel(error)); // eslint-disable-line no-confusing-arrow
            });

            return {
                promise: wrappedPromise,
                cancel() {
                    canceled = true;
                },
            };
        })();

        this.loadPromise.promise
            .then(this.onScriptLoaded)
            .catch(this.onScriptError);

        document.body.appendChild(script);
    }

    componentDidUpdate() {
        if (!scriptLoading) {
            this.updatePaystackHandler();
        }
    }

    componentWillUnmount() {
        if (this.loadPromise) {
            this.loadPromise.cancel();
        }
        if (ReactPaystackInline.PaystackHandler && this.state.open) {
            ReactPaystackInline.PaystackHandler.close();
        }
    }

    onScriptLoaded = () => {
        if (!ReactPaystackInline.PaystackHandler) {
            var paystackParams = this.getConfig();
            paystackParams = Object.assign(paystackParams, {
                key: this.props.paystackKey
            });
            ReactPaystackInline.PaystackHandler = PaystackPop.setup(paystackParams); // eslint-disable-line no-undef
        }
    }

    onScriptError = (...args) => {
        this.hideLoadingDialog();
        if (this.props.onScriptError) {
            this.props.onScriptError.apply(this, args);
        }
    }

    onClosed = (...args) => {
        this.setState({
            open: false
        });
        if (this.props.closed) {
            this.props.closed.apply(this, args);
        }
    }

    getConfig = () => [
        'callback',
        'amount',
        'email',
        'metadata',
        'ref',
    ].reduce((config, key) => Object.assign({}, config, this.props.hasOwnProperty(key) && {
        [key]: this.props[key],
    }), {
        onClose: this.onClosed,
    });

    updatePaystackHandler() {
        if (!ReactPaystackInline.PaystackHandler || this.props.reconfigureOnUpdate) {
            var paystackParams = this.getConfig();
            paystackParams = Object.assign(paystackParams, {
                key: this.props.paystackKey
            });
            ReactPaystackInline.PaystackHandler = PaystackPop.setup(paystackParams); // eslint-disable-line no-undef
        }
    }

    showPaystackDialog() {
        ReactPaystackInline.PaystackHandler.openIframe();
    }

    onClick = () => { // eslint-disable-line react/sort-comp

        if (scriptDidError) {
            try {
                throw new Error('Tried to call onClick, but PaystackInline failed to load');
            } catch (x) {} // eslint-disable-line no-empty
        } else if (ReactPaystackInline.PaystackHandler) {
            this.showPaystackDialog();
        } else {
            throw new Error("Gorialla Error");
        }
    }

    render() {
        const { ComponentClass } = this.props;
        if (this.props.lazy && this.props.formId) return ( < div > < /div>);
            if (this.props.children) {
                return (
                	<ComponentClass {... {
                            [this.props.triggerEvent]: this.onClick,
                        	}
                    	}
                    children={ this.props.children }
                    />
                );
            }

            // return !this.props.lazy ? this.renderDisabledButton() : this.renderDefaultStripeButton();
	}
}