import { LitElement, html, css } from 'lit-element';
import { pbMixin } from './pb-mixin.js';

class PbPage extends pbMixin(LitElement) {

    static get properties() {
        return {
            ...super.properties,
            appRoot: {
                type: String,
                attribute: 'app-root'
            },
            template: {
                type: String
            },
            endpoint: {
                type: String
            }
        };
    }

    constructor() {
        super();
        this.endpoint = ".";
    }

    connectedCallback() {
        super.connectedCallback();

        this.signalReady('pb-page-ready', {
            endpoint: this.endpoint
        });
    }

    firstUpdated() {
        super.firstUpdated();
        console.log('<pb-page> endpoint: %s; trigger window resize', this.endpoint);
        this.querySelectorAll('app-header').forEach(h => h._notifyLayoutChanged());
    }

    render() {
        return html`<slot></slot>`;
    }

    static get styles() {
        return css`
        :host {
            display: block;
        }
        `;
    }
}

customElements.define('pb-page', PbPage);