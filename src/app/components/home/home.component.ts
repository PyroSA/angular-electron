import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ipcRenderer } from 'electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private ipcRenderer: typeof ipcRenderer;
  private connectResponse: any;
  private queryResponse: any;

  constructor(private cd: ChangeDetectorRef) {
    this.ipcRenderer = window.require('electron').ipcRenderer;
  }

  public connect () {
    console.log('connect');
    // TODO: Populate config from UI
    const config = {
      user: 'sa',
      password: 'Pass-123',
      server: '192.168.56.10\\SQL2014', // You can use 'localhost\\instance' to connect to named instance
      database: 'Conv',
    };
    ipcRenderer.send('db-connect', config);
  }

  private connectReply(event, arg) {
    console.log('connect-reply', arg);
    this.connectResponse = arg;
    console.log(this.cd);
  }

  public query () {
    console.log('query');
    ipcRenderer.send('db-query', { query: 'select * from uv_OUTPUT_EntityMasterInfo' });
  }

  private queryReply(event, arg) {
    console.log('query-reply', arg);
    this.queryResponse = arg;
    this.cd.detectChanges();
  }

  get connectResponseString () {
    console.log('connectResponseString');
    return JSON.stringify(this.connectResponse, null, 2);
  }

  get queryResponseString () {
    return JSON.stringify(this.queryResponse, null, 2);
  }

  ngOnInit() {
    ipcRenderer.on('db-connect-reply', this.connectReply);
    ipcRenderer.on('db-query-reply', this.connectReply);
  }
}
