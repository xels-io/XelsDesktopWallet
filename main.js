"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var os = require("os");
if (os.arch() === 'arm') {
    electron_1.app.disableHardwareAcceleration();
}
// Set to true if you want to build Core for sidechains
var buildForSidechain = false;
var daemonName = buildForSidechain ? 'Xels.CirrusD' : 'Xels.XelsD';
var serve;
var testnet;
var sidechain;
var nodaemon;
var args = process.argv.slice(1);
serve = args.some(function (val) { return val === '--serve' || val === '-serve'; });
testnet = args.some(function (val) { return val === '--testnet' || val === '-testnet'; });
sidechain = args.some(function (val) { return val === '--sidechain' || val === '-sidechain'; });
nodaemon = args.some(function (val) { return val === '--nodaemon' || val === '-nodaemon'; });
if (buildForSidechain) {
    sidechain = true;
}
var applicationName = sidechain ? 'Cirrus Core' : 'Xels Core';
// Set default API port according to network
var apiPortDefault;
if (testnet && !sidechain) {
    apiPortDefault = 38221;
}
else if (!testnet && !sidechain) {
    apiPortDefault = 37221;
}
else if (sidechain && testnet) {
    apiPortDefault = 38223;
}
else if (sidechain && !testnet) {
    apiPortDefault = 37223;
}
// Disable error dialogs by overriding
electron_1.dialog.showErrorBox = function (title, content) {
    console.log(title + "\n" + content);
};
// Sets default arguments
var coreargs = require('minimist')(args, {
    default: {
        daemonip: 'localhost',
        apiport: apiPortDefault
    },
});
// Apply arguments to override default daemon IP and port
var daemonIP;
var apiPort;
daemonIP = coreargs.daemonip;
apiPort = coreargs.apiport;
// Prevents daemon from starting if connecting to remote daemon.
if (daemonIP !== 'localhost') {
    nodaemon = true;
}
electron_1.ipcMain.on('get-port', function (event, arg) {
    event.returnValue = apiPort;
});
electron_1.ipcMain.on('get-testnet', function (event, arg) {
    event.returnValue = testnet;
});
electron_1.ipcMain.on('get-sidechain', function (event, arg) {
    event.returnValue = sidechain;
});
electron_1.ipcMain.on('get-daemonip', function (event, arg) {
    event.returnValue = daemonIP;
});
require('electron-context-menu')({
    showInspectElement: serve
});
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
function createWindow() {
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({
        width: 1350,
        height: 800,
        frame: true,
        minWidth: 1150,
        minHeight: 650,
        title: applicationName
    });
    if (serve) {
        require('electron-reload')(__dirname, {});
        mainWindow.loadURL('http://localhost:4200');
    }
    else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
    if (serve) {
        mainWindow.webContents.openDevTools();
    }
    // Emitted when the window is going to close.
    mainWindow.on('close', function () {
        if (!serve && !nodaemon) {
            shutdownDaemon(daemonIP, apiPort);
        }
    });
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', function () {
    if (serve) {
        console.log('Xels UI was started in development mode. This requires the user to be running the Xels Full Node Daemon himself.');
    }
    else {
        if (!nodaemon) {
            startDaemon();
        }
    }
    createTray();
    createWindow();
    if (os.platform() === 'darwin') {
        createMenu();
    }
});
/* 'before-quit' is emitted when Electron receives
 * the signal to exit and wants to start closing windows */
electron_1.app.on('before-quit', function () {
    if (!serve && !nodaemon) {
        shutdownDaemon(daemonIP, apiPort);
    }
});
electron_1.app.on('quit', function () {
    if (!serve && !nodaemon) {
        shutdownDaemon(daemonIP, apiPort);
    }
});
// Quit when all windows are closed.
electron_1.app.on('window-all-closed', function () {
    electron_1.app.quit();
});
electron_1.app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
function shutdownDaemon(daemonAddr, portNumber) {
    var http = require('http');
    var body = JSON.stringify({});
    var request = new http.ClientRequest({
        method: 'POST',
        hostname: daemonAddr,
        port: portNumber,
        path: '/api/node/shutdown',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    });
    request.write('true');
    request.on('error', function (e) { });
    request.on('timeout', function (e) { request.abort(); });
    request.on('uncaughtException', function (e) { request.abort(); });
    request.end(body);
}
;
function startDaemon() {
    var daemonProcess;
    var spawnDaemon = require('child_process').spawn;
    var daemonPath;
    if (os.platform() === 'win32') {
        daemonPath = path.resolve(__dirname, '..\\..\\resources\\daemon\\' + daemonName + '.exe');
    }
    else if (os.platform() === 'linux') {
        daemonPath = path.resolve(__dirname, '..//..//resources//daemon//' + daemonName);
    }
    else {
        daemonPath = path.resolve(__dirname, '..//..//resources//daemon//' + daemonName);
    }
    daemonProcess = spawnDaemon(daemonPath, [args.join(' ').replace('--', '-')], {
        detached: true
    });
    daemonProcess.stdout.on('data', function (data) {
        writeLog("Xels: " + data);
    });
}
function createTray() {
    // Put the app in system tray
    var iconPath = 'xels/icon-16.png';
    if (sidechain) {
        iconPath = 'cirrus/icon-16.png';
    }
    var trayIcon;
    if (serve) {
        trayIcon = electron_1.nativeImage.createFromPath('./src/assets/images/' + iconPath);
    }
    else {
        trayIcon = electron_1.nativeImage.createFromPath(path.resolve(__dirname, '../../resources/src/assets/images/' + iconPath));
    }
    var systemTray = new electron_1.Tray(trayIcon);
    var contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Hide/Show',
            click: function () {
                mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
            }
        },
        {
            label: 'Exit',
            click: function () {
                electron_1.app.quit();
            }
        }
    ]);
    systemTray.setToolTip('Xels Core');
    systemTray.setContextMenu(contextMenu);
    systemTray.on('click', function () {
        if (!mainWindow.isVisible()) {
            mainWindow.show();
        }
        if (!mainWindow.isFocused()) {
            mainWindow.focus();
        }
    });
    electron_1.app.on('window-all-closed', function () {
        if (systemTray) {
            systemTray.destroy();
        }
    });
}
function writeLog(msg) {
    console.log(msg);
}
function createMenu() {
    var menuTemplate = [{
            label: electron_1.app.getName(),
            submenu: [
                { label: 'About ' + electron_1.app.getName(), selector: 'orderFrontStandardAboutPanel:' },
                { label: 'Quit', accelerator: 'Command+Q', click: function () { electron_1.app.quit(); } }
            ]
        }, {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
                { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
                { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
                { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
                { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
            ]
        }
    ];
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(menuTemplate));
}
//# sourceMappingURL=main.js.map