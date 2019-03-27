"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var os = require("os");
if (os.arch() == 'arm') {
    electron_1.app.disableHardwareAcceleration();
}
var serve;
var testnet;
var sidechain;
var nodaemon;
var args = process.argv.slice(1);
serve = args.some(function (val) { return val === "--serve" || val === "-serve"; });
testnet = args.some(function (val) { return val === "--testnet" || val === "-testnet"; });
sidechain = args.some(function (val) { return val === "--sidechain" || val === "-sidechain"; });
nodaemon = args.some(function (val) { return val === "--nodaemon" || val === "-nodaemon"; });
var apiPort;
if (testnet && !sidechain) {
    apiPort = 38221;
}
else if (!testnet && !sidechain) {
    apiPort = 37221;
}
else if (sidechain && testnet) {
    apiPort = 38225;
}
else if (sidechain && !testnet) {
    apiPort = 38225;
}
// Disable error dialogs by overriding
electron_1.dialog.showErrorBox = function (title, content) {
    console.log(title + "\n" + content);
};
electron_1.ipcMain.on('get-port', function (event, arg) {
    event.returnValue = apiPort;
});
electron_1.ipcMain.on('get-testnet', function (event, arg) {
    event.returnValue = testnet;
});
electron_1.ipcMain.on('get-sidechain', function (event, arg) {
    event.returnValue = sidechain;
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
        width: 1150,
        height: 650,
        frame: true,
        minWidth: 1150,
        minHeight: 650,
        title: "Xels Core"
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
    });
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}
;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', function () {
    if (serve) {
        console.log("Xels UI was started in development mode. This requires the user to be running the Xels Full Node Daemon himself.");
    }
    else {
        if (sidechain && !nodaemon) {
            startDaemon("Xels.SidechainD");
        }
        else if (!nodaemon) {
            startDaemon("Xels.XelsD");
        }
    }
    createTray();
    createWindow();
    if (os.platform() === 'darwin') {
        createMenu();
    }
});
electron_1.app.on('quit', function () {
    if (!serve && !nodaemon) {
        shutdownDaemon(_this.portNumber);
    }
});
// Quit when all windows are closed.
electron_1.app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
function shutdownDaemon(portNumber) {
    var request = electron_1.net.request({
        method: 'POST',
        hostname: 'localhost',
        port: portNumber,
        path: '/api/node/shutdown',
    });
    request.setHeader("content-type", "application/json-patch+json");
    request.write('true');
    request.end();
}
;
function startDaemon(daemonName) {
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
    if (!testnet) {
        daemonProcess = spawnDaemon(daemonPath, {
            detached: true
        });
    }
    else if (testnet) {
        daemonProcess = spawnDaemon(daemonPath, ['-testnet'], {
            detached: true
        });
    }
    daemonProcess.stdout.on('data', function (data) {
        writeLog("Xels: " + data);
    });
}
function createTray() {
    //Put the app in system tray
    var trayIcon;
    if (serve) {
        trayIcon = electron_1.nativeImage.createFromPath('./src/assets/images/icon-tray.png');
    }
    else {
        trayIcon = electron_1.nativeImage.createFromPath(path.resolve(__dirname, '../../resources/src/assets/images/icon-tray.png'));
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
        if (systemTray)
            systemTray.destroy();
    });
}
;
function writeLog(msg) {
    console.log(msg);
}
;
function createMenu() {
    var menuTemplate = [{
            label: electron_1.app.getName(),
            submenu: [
                { label: "About " + electron_1.app.getName(), selector: "orderFrontStandardAboutPanel:" },
                { label: "Quit", accelerator: "Command+Q", click: function () { electron_1.app.quit(); } }
            ]
        }, {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        }
    ];
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(menuTemplate));
}
;
//# sourceMappingURL=main.js.map