import { LitElement, html, css } from 'lit-element';
import "@polymer/paper-dropdown-menu/paper-dropdown-menu-light";
import "@polymer/paper-listbox";
import "@polymer/paper-item";
import { translate } from "./pb-i18n.js";
import { pbMixin } from './pb-mixin.js';


/**
 * Replacement for an HTML select element with additional features:
 * 
 * 1. item list can be loaded from remote endpoint via AJAX
 * 2. may contain additional nested form in the slot
 *    named `subform`, whose values will be sent with the AJAX request
 *
 * @slot - a static list of paper-item to be shown as options. each paper-item should have a value attribute
 * @slot subform - additional form controls
 */
export class PbSelect extends pbMixin(LitElement) {
    static get properties() {
        return {
            /**
             * Label to display above the select or inside if nothing is selected
             */
            label: {
                type: String
            },
            /**
             * Initial value to select. If not set, no item will be selected
             */
            value: {
                type: String,
                reflect: true
            },
            /**
             * name used when submitted inside a form
             */
            name: {
                type: String
            },
            /**
             * Optional URL to query for suggestions. If relative, it is interpreted
             * relative to the endpoint defined on a surrounding `pb-page`.
             */
            source: {
                type: String
            },
            _items: {
                type: Array
            },
            ...super.properties
        };
    }

    constructor() {
        super();
        this._value = null;
        this._items = [];
    }

    set value(newVal) {
        const oldVal = this._value;
        this._value = newVal;
        if (this._hidden) {
            this._hidden.value = this._value;
        }
        this.requestUpdate('value', oldVal);
    }

    get value() {
        return this._value;
    }

    connectedCallback() {
        super.connectedCallback();

        this._hidden = document.createElement('input');
        this._hidden.type = 'hidden';
        this._hidden.name = this.name;
        this._hidden.value = this.value;
        this._hidden.slot = 'output';
        this.appendChild(this._hidden);
    }

    firstUpdated() {
        super.firstUpdated();

        const slot = this.shadowRoot.querySelector('[name="subform"]');
        if (slot) {
            slot.assignedNodes().forEach((node) => {
                if (this.name) {
                    node.addEventListener('change', this._loadRemote.bind(this));
                }
                const inputs = node.querySelectorAll('[name]');
                inputs.forEach((input) => {
                    input.addEventListener('change', this._loadRemote.bind(this));
                });
            });
        }
        this._loadRemote();
    }

    _clear() {
        const slot = this.shadowRoot.querySelector('slot:not([name])');
        if (slot) {
            slot.assignedNodes().forEach((node) => {
                node.parentNode.removeChild(node);
            });
        }
    }

    _loadRemote() {
        if (this.source) {
            const base = this.getEndpoint() === '.' ? window.location.href : `${this.getEndpoint()}/`;
            let url = new URL(this.source, base).toString();
            if (url.indexOf('?') > -1) {
                url = `${url}&${this._getParameters()}`;
            } else {
                url = `${url}?${this._getParameters()}`;
            }
            console.log('<pb-select> loading items from %s', url);
            fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'same-origin'
            })
                .then((response) => response.json())
                .then((json) => {
                    this._clear();
                    const items = [];
                    json.forEach((item) => {
                        items.push({label: item.text, value: item.value});
                    });
                    console.log('<pb-select> loaded %d items', items.length);
                    this._items = items;
                })
                .catch(() => {
                    console.error('<pb-select> request to %s failed', url);
                });
        }
    }

    _getParameters() {
        const slot = this.shadowRoot.querySelector('[name="subform"]');
        const params = [];
        if (slot) {
            slot.assignedNodes().forEach((node) => {
                const inputs = node.querySelectorAll('[name]');
                inputs.forEach((input) => {
                    params.push(`${input.name}=${encodeURIComponent(input.value)}`);
                });
            });
        }
        return params.join('&');
    }

    render() {
        return html`
            <slot name="subform"></slot>
            <paper-dropdown-menu label="${translate(this.label)}">
                <paper-listbox id="list" slot="dropdown-content" class="dropdown-content" .selected="${this.value}"
                    attr-for-selected="value" @iron-select="${this._changed}">
                    <slot></slot>
                    ${this._items.map((item) => html`<paper-item value="${item.value}">${item.label}</paper-item>`)}
                </paper-listbox>
            </paper-dropdown-menu>
            <slot name="output"></slot>
        `;
    }

    _changed(ev) {
        ev.preventDefault();
        const list = this.shadowRoot.getElementById('list');
        if (this._hidden.value === list.selected) {
            return;
        }
        this._hidden.value = list.selected;
        this.dispatchEvent(new CustomEvent('change'));
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
        `;
    }
}
customElements.define('pb-select', PbSelect);