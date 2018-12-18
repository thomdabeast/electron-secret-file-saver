__basedir = __dirname;

var window = null;

const {
    app,
    BrowserWindow,
    Menu
} = require('electron');

const ipcMain = require('electron').ipcMain;
var fs = require('fs');
var crypto = require('crypto');
var alogrithm = 'aes-256-ctr';

function createMenu() {
    const template = [{
        label: "File",
        submenu: [{
                label: "New ⌘N",
                click: () => {
                    window.webContents.send('new file');
                }
            },
            {
                label: "Open ⌘O",
                click: () => {
                    window.webContents.send('open file');
                }
            },
            {
                label: "Save ⌘S",
                click: () => {
                    window.webContents.send('save file');
                }
            },
            {
                label: "Close ⌘Q",
                click: () => {
                    if (process.platform !== 'darwin') {
                        app.quit();
                    } else {
                        app.exit();
                        window = null;
                    }
                }
            }
        ]
    }];

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [{
                    role: 'about'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    role: 'hide'
                },
                {
                    role: 'hideothers'
                },
                {
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'quit'
                }
            ]
        })
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    window = new BrowserWindow({
        width: 1280,
        height: 720
    });

    window.loadFile(`${__basedir}/ui/index.html`);

    window.webContents.openDevTools();

    window.on('close', () => window = null);

    createMenu();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (window == null) createWindow();
});

function encrypt(data) {
    var cipher = crypto.createCipher(alogrithm, data.password);
    var crypted = cipher.update(data.text, 'utf8', 'hex');
    crypted += cipher.final('hex');

    return crypted;
}

function decrypt(data) {
    var decipher = crypto.createDecipher(alogrithm, data.password);
    var decrypted = decipher.update(data.text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

ipcMain.on('save file', (event, data) => {
    console.log(JSON.stringify(data));
    fs.writeFileSync(data.filePath, encrypt(data));
})

ipcMain.on('open file', (event, data) => {
    console.log(JSON.stringify(data))
    event.sender.send('opened file', decrypt({
        text: fs.readFileSync(data.filePath).toString(),
        password: data.password
    }))
});