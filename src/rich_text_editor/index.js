/**
 * * [add](#add)
 * * [get](#get)
 * * [getAll](#getall)
 * * [remove](#remove)
 * * [getToolbarEl](#gettoolbarel)
 *
 * This module allows to customize the toolbar of the Rich Text Editor and use commands from the HTML Editing APIs.
 * For more info about HTML Editing APIs check here:
 * https://developer.mozilla.org/it/docs/Web/API/Document/execCommand
 *
 * It's highly recommended to keep this toolbar as small as possible, especially from styling commands (eg. 'fontSize')
 * and leave this task to the Style Manager.
 *
 * Before using methods you should get first the module from the editor instance, in this way:
 *
 * ```js
 * var rte = editor.RichTextEditor;
 * ```
 * Complete list of commands
 * https://developer.mozilla.org/it/docs/Web/API/Document/execCommand
 * http://www.quirksmode.org/dom/execCommand.html
 * @module RichTextEditor
 */
import RichTextEditor from './model/RichTextEditor';
import {on, off} from 'utils/mixins'

module.exports = () => {
  let config = {};
  const defaults = require('./config/config');
  let toolbar, actions, lastEl;

  return {

    customRte: null,

    /**
     * Name of the module
     * @type {String}
     * @private
     */
    name: 'RichTextEditor',

    /**
     * Initialize module. Automatically called with a new instance of the editor
     * @param {Object} opts Options
     * @private
     */
    init(opts = {}) {
      config = opts;

      for (let name in defaults) {
        if (!(name in config)) {
          config[name] = defaults[name];
        }
      }

      const ppfx = config.pStylePrefix;

      if (ppfx) {
        config.stylePrefix = ppfx + config.stylePrefix;
      }

      this.pfx = config.stylePrefix;
      actions = config.actions || [];
      toolbar = document.createElement('div');
      toolbar.className = `${ppfx}rte-toolbar`;

      //Avoid closing on toolbar clicking
      on(toolbar, 'mousedown', e => e.stopPropagation());
      return this;
    },

    postRender(ev) {
      const canvas = ev.model.get('Canvas');
      toolbar.style.pointerEvents = 'all';
      canvas.getToolsEl().appendChild(toolbar);
    },

    /**
     * Add a new action to the RTE toolbar
     * @param {string} name Action name
     * @param {Object} opts Action options
     * @example
     * rte.add('bold', {
     *   icon: '<b>B</b>',
     *   title: 'Bold',
     *   result: rte => rte.exec('bold')
     * });
     * rte.add('link', {
     *   icon: 'L',
     *   title: 'Link',
     *   result: rte => {
     *    const url = window.prompt('Enter the link URL')
     *    if (url) rte.exec('createLink', url)
     *   }
     * });
     */
    add(name, opts = {}) {
      opts.name = name;
      actions.push(opts);
      //gloabl.addAction();
    },

    /**
     * Get the command by its name
     * @param {string} command Command name
     * @return {Model}
     * @example
     * var cm = rte.get('fontSize');
     */
    get(command) {
      return commands.where({command})[0];
    },

    /**
     * Returns the collection of commands
     * @return {Collection}
     */
    getAll() {
      return commands;
    },

    /**
     * Triggered when the offset of the editor is changed
     * @private
     */
    udpatePosition() {
      const un = 'px';
      const canvas = config.em.get('Canvas');
      const pos = canvas.getTargetToElementDim(toolbar, lastEl, {
        event: 'rteToolbarPosUpdate',
      });

      if (config.adjustToolbar) {
        // Move the toolbar down when the top canvas edge is reached
        if (pos.top <= pos.canvasTop) {
          pos.top = pos.elementTop + pos.elementHeight;
        }
      }

      const toolbarStyle = toolbar.style;
      toolbarStyle.top = pos.top + un;
      toolbarStyle.left = pos.left + un;
    },

    /**
     * Enable rich text editor on the element
     * @param {View} view Component view
     * @param {Object} rte The instance of already defined RTE
     * @private
     * */
    enable(view, rte) {
      lastEl = view.el;
      const em = config.em;
      const pfx = this.pfx;
      const el = view.getChildrenContainer();
      const customRte = this.customRte;
      const actionbar = this.actionbar;
      const actionbarContainer = toolbar;
      const classes = {
        actionbar: `${pfx}actionbar`,
        button: `${pfx}action`,
      };

      toolbar.style.display = '';
      rte = customRte ? customRte.enable(el, rte) :
        new RichTextEditor({el, actionbarContainer, classes, actionbar}).enable();

      if (rte.actionbar) {
        this.actionbar = rte.actionbar;
      }

      if (em) {
        setTimeout(this.udpatePosition.bind(this), 0);
        const event = 'change:canvasOffset canvasScroll';
        em.off(event, this.udpatePosition, this);
        em.on(event, this.udpatePosition, this);
      }

      return rte;
    },

    /**
     * Unbind rich text editor from the element
     * @param {View} view
     * @param {Object} rte The instance of already defined RTE
     * @private
     * */
    disable(view, rte) {
      const customRte = this.customRte;
      var el = view.getChildrenContainer();

      if (customRte) {
        customRte.disable(el, rte);
      } else {
        rte.disable();
      }

      toolbar.style.display = 'none';
    },

    /**
     * Return the toolbar element
     * @return {HTMLElement}
     * @private
     */
    getToolbarEl() {
      return toolbar;
    },
  };
};
