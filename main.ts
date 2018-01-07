import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as sql from 'mssql';
import { connect } from 'tls';

let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

if (serve) {
  require('electron-reload')(__dirname, {
  });
}

function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height
  });

  // and load the index.html of the app.
  win.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

let pool;

async function connectDb(event, arg) {
  console.log('Connect', arg);
  const config = {
    user: 'sa',
    password: 'Pass-123',
    server: 'WERNER-PC\\SQLEXPRESS', // You can use 'localhost\\instance' to connect to named instance
    database: 'test',
  };
  try {
    pool = await sql.connect(config)
    console.dir(pool);
    event.sender.send('db-connect-reply', {
      connection: true
    });
  } catch (err) {
    console.error(err);
    event.sender.send('db-connect-reply', {
      error: new Error('Database not connected'),
      connection: false
    });
  }
}

async function queryDb(event, arg) {
  console.log('Query', arg);
  if (!pool) {
    event.sender.send('db-query-reply', {
      error: new Error('Database not connected')
    });
  }

  try {
    const queryResult = await pool.request()
        .input('id', sql.Int, arg.value || 0)
        .query('select * from test where id > @id')

    console.dir(queryResult)
    event.sender.send('db-query-reply', queryResult);
  } catch (err) {
    console.error(err);
    event.sender.send('db-query-reply', { error: err });
  }
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  ipcMain.on('db-connect', connectDb);
  ipcMain.on('db-query', queryDb);

} catch (err) {
  console.log('Main loop error', err);
}
