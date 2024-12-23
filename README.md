# MSC-Backnang-Zeitnahme

## Installation

### Git

For easy version control, we use Git. You can download the latest version of Git from [here](https://git-scm.com/download/win).

```bat
winget install -e --id Git.Git
```

### Node.js

To run the Node.js application, you need to install Node.js. You can download the latest version of Node.js from [here](https://nodejs.org/en/download/) or use `winget`.

```bat
winget install -e --id OpenJS.NodeJS
```

### PM2

To control the Node.js application, we use PM2. You can install PM2 globally using the following command.

```bat
npm install -g pm2
```

> You can also link PM2 to the web interface by running the following command.
>
> Below is a command to link PM2 to the console of the MSC-Backnang. You should not run this command on your local machine. Pls use your own `link` command.
>
> `pm2 link uya5t4t5nmc2omi qauke1wfo0unsp0
`

### Initialize the project

To initialize the project, you need to clone the repository and install the dependencies. You can do this by running the following commands.

```bat
git clone https://github.com/HendrikRauh/MSC-Backnang-Zeitnahme.git
cd MSC-Backnang-Zeitnahme
npm run update
```

### Prolific driver

To use the Prolific Serial-to-USB device, you need to install the driver. You can download the latest version of the driver. You can download the latest version of the driver from [here](https://www.prolific.com.tw/US/ShowProduct.aspx?p_id=225&pcid=41).

> **Note:** You need to install the driver and restart the system before you can connect the device.

### Scripts for easy usage

To make the usage of the application easier, you can create a script that starts the application. You can do this by creating a new file on the desktop ending with `.bat` and adding the code to start the application.

```bat
@echo off
cd MSC-Backnang-Zeitnahme
npm run easy-start --silent
```

```bat
@echo off
cd MSC-Backnang-Zeitnahme
npm run update --silent
```

> **Note:** You need to change the path to the project folder if you have not cloned the repository to the desktop.
