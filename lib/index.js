'use babel';

import SortTable from './SortTable'

function _sort(order) {
    const activeEditor = inkdrop.getActiveEditor();
    if (activeEditor) {
        new SortTable(order, activeEditor.cm).sort();
    }
}

export function activate() {
    this.subscription = inkdrop.commands.add(document.body, {
        'sort-table:asc': () => _sort('asc'),
        'sort-table:desc': () => _sort('desc'),
    });
}

export function deactivate() {
    this.subscription.dispose();
}
