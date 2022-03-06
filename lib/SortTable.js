'use babel';

export default class SortTable {
    constructor(order, editor) {
        this.order_ = order;
        this.editor_ = editor;
        this.cursor_ = editor.getCursor();
    }

    static make_table_regex() {
        return new RegExp(/^\s*\|/, 'u');
    }

    static is_in_table(str) {
        const re = SortTable.make_table_regex();
        return re.test(str);
    }

    get_rows_index_in_table() {
        const cursor = this.editor_.getCursor();
        const currentLine = cursor['line'];
        const lastLine = this.editor_.lastLine();

        // search start line of a table
        let start = {line: null, ch: null};
        for (let pos = currentLine; pos >= 0; pos--) {
            if (SortTable.is_in_table(this.editor_.getLine(pos))) {
                start.line = pos;
                start.ch = 0;
            } else {
                break;
            }
        }
        // search end line of a table
        let end = {line: null, ch: null};
        for (let pos = currentLine; pos <= lastLine; pos++) {
            if (SortTable.is_in_table(this.editor_.getLine(pos))) {
                end.line = pos;
                end.ch = this.editor_.getLine(pos).length;
            } else {
                break;
            }
        }

        return ({start: start, end: end});
    }

    parse_focused_table() {
        const indexOfFirstHeader = 0;
        const numberOfLinesMeaningHeader = 2;

        let info = this.get_rows_index_in_table();

        info.tableRaw = [];
        for (let line = info.start.line; line <= info.end.line; line++) {
            const content = this.editor_.getLine(line);
            info.tableRaw.push(content);
        }

        info.headerRow = info.tableRaw[indexOfFirstHeader];
        info.header = SortTable.parse_column_contents(info.headerRow);

        info.bodyRow = info.tableRaw.slice(numberOfLinesMeaningHeader);
        info.body = [];
        for (let rowID = 0; rowID < info.bodyRow.length; rowID++) {
            let rows = [rowID];
            rows.push(...SortTable.parse_column_contents(info.bodyRow[rowID]));
            info.body.push(rows);
        }

        return info;
    }

    static parse_column_contents(contentsRow) {
        let contents = contentsRow.split(/\s*\|\s*/);
        return contents.filter(function (item) {
            return item !== '';
        })
    }

    get_focused_column_index() {
        const cursor = this.editor_.getCursor();
        const row = this.editor_.getLine(cursor['line']);

        let colomn_position = null;
        let indexCursor = row.indexOf('|');

        while (indexCursor < cursor['ch']) {
            indexCursor = row.indexOf('|', ++indexCursor);

            if (-1 === indexCursor) {
                colomn_position = null;
                break;
            }
            colomn_position++;
        }

        return colomn_position > 0 ? --colomn_position : colomn_position;
    }

    static compare(a, b) {
        if (isFinite(a) && isFinite(b)) {
            return a - b;
        } else {
            if (a < b) return -1;
            if (a > b) return 1;
        }
    }

    static isEqualTableRaw(a, b) {
        const joinedA = a.join('\n');
        const joinedB = b.join('\n');
        return joinedA === joinedB;
    }

    sort() {
        const numberOfLinesMeaningHeader = 2;
        const shiftForRowID = 1;

        const tableInfo = this.parse_focused_table();
        if (tableInfo.header.length === 0 || tableInfo.body.length === 0) return;

        const columnIndex = this.get_focused_column_index();
        if (columnIndex === null) return;

        const order = this.order_;
        const sortedBody = tableInfo.body.sort(function (a, b) {
            if (order === 'asc') {
                return SortTable.compare(a[columnIndex + shiftForRowID], b[columnIndex + shiftForRowID]);
            } else if (order === 'desc') {
                return SortTable.compare(b[columnIndex + shiftForRowID], a[columnIndex + shiftForRowID]);
            }
        });


        let sortedTableRaw = tableInfo.tableRaw.slice(0, numberOfLinesMeaningHeader);
        for (let pos = 0; pos < tableInfo.body.length; pos++) {
            sortedTableRaw.push(tableInfo.bodyRow[sortedBody[pos][0]]);
        }

        if (SortTable.isEqualTableRaw(sortedTableRaw, tableInfo.tableRaw)) return;

        this.editor_.replaceRange(sortedTableRaw.join('\n'), tableInfo.start, tableInfo.end, tableInfo.tableRaw.join('\n'));
        this.editor_.setCursor(this.cursor_);
    }
}
