import {DataSource} from '../types';
import {DataTable} from './data-table';
import {ColumnBase} from './column-base';
import {Settings} from './settings';

export class DataManager extends DataTable {

  public service: DataSource;
  public errors: any;
  public loading: boolean;
  public items: any[];
  public item: any;
  public isNewItem: boolean;
  public detailView: boolean;
  public formValid: boolean = true;
  public refreshRowOnSave: boolean;

  constructor(columns?: ColumnBase[], settings?: Settings) {
    super(columns, settings);
  }

  createColumns(columns: ColumnBase[]) {
    super.createColumns(columns);
    this.refreshRowOnSave = this.columns.some(x => x.keyColumn !== undefined);
  }

  setService(service: DataSource) {
    this.service = service;
    this.service.url = this.settings.api;
    this.service.primaryKeys = this.settings.primaryKeys;
  }

  getItems(): Promise<any> {
    this.loading = true;
    this.errors = null;
    return this.service
      .getItems(this.pager.current, this.dataFilter.filters, this.sorter.sortMeta)
      .then(data => {
        this.loading = false;
        this.items = data.items;
        this.pager.total = data._meta.totalCount;
        this.pager.perPage = data._meta.perPage;
      })
      .catch(error => {
        this.loading = false;
        this.errors = error;
      });
  }

  create(row: any) {
    this.loading = true;
    this.errors = null;
    this.service
      .post(row)
      .then(res => {
        this.loading = false;
        this.errors = null;
        this.afterCreate(res);
        this.item = res;
      })
      .catch(error => {
        this.loading = false;
        this.errors = error;
      });
  }

  update(row: any) {
    this.loading = true;
    this.errors = null;
    this.service.put(row)
      .then(res => {
        this.loading = false;
        this.errors = null;
        this.afterUpdate(res);
      })
      .catch(error => {
        this.loading = false;
        this.errors = error;
      });
  }

  delete(row: any) {
    this.loading = true;
    this.errors = null;
    this.service
      .delete(row)
      .then(res => {
        this.loading = false;
        this.errors = null;
        this.afterDelete(true);
        this.item = null;
      })
      .catch(error => {
        this.loading = false;
        this.errors = error;
      });
  }

  afterCreate(result: any) {
    if (this.refreshRowOnSave) {
      this.refreshRow(result, true);
    } else {
      this.items.push(result);
    }
  }

  afterUpdate(result: any) {
    if (this.refreshRowOnSave) {
      this.refreshSelectedRow();
    } else {
      Object.keys(result).forEach(function (k) {
        if (k in this.items[this.selectedRowIndex]) {
          this.items[this.selectedRowIndex][k] = result[k];
        }
      }.bind(this));
    }
  }

  afterDelete(result: boolean) {
    if (result) {
      this.items.splice(this.selectedRowIndex, 1);
    }
  }

  refreshRow(row: any, isNew: boolean) {
    this.loading = true;
    this.errors = null;
    this.service.getItem(row)
      .then(data => {
        this.loading = false;
        if (isNew) {
          this.items.push(data);
        } else {
          this.items[this.selectedRowIndex] = data;
        }
      })
      .catch(error => {
        this.loading = false;
        this.errors = error;
      });
  }

  refreshSelectedRow() {
    this.refreshRow(this.items[this.selectedRowIndex], false);
  }

  saveRow() {
    if (this.isNewItem) {
      this.create(this.item);
    } else {
      this.update(this.item);
    }
  }

  deleteRow() {
    this.delete(this.item);
  }

  clearItem() {
    this.item = {};
    this.isNewItem = true;
  }

  setItem() {
    const item = this.items[this.selectedRowIndex];
    this.item = Object.assign({}, item);
    this.isNewItem = false;
  }

  getSelectedRow() {
    return this.items[this.selectedRowIndex];
  }

  clear() {
    this.items = [];
    this.pager.total = 0;
    this.detailView = false;
  }

}
