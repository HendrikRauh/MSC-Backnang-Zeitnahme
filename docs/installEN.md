# Installation Guide

## Git

For version control, we use Git. Download the latest version of Git from [here](https://git-scm.com/download/win).

```bat
winget install -e --id Git.Git
```

## Node.js

To run the Node.js application, you need to install Node.js. Download the latest version from [here](https://nodejs.org/en/download/) or use `winget`.

```bat
winget install -e --id OpenJS.NodeJS
```

## PM2

We use PM2 to manage the Node.js application. Install PM2 globally with the following command:

```bat
npm install -g pm2
```

> **Note:** To link PM2 to the web interface, use the following command. This example links PM2 to the MSC-Backnang console. Do not run this command on your local machine; use your own `link` command.
>
> ```bat
> pm2 link uya5t4t5nmc2omi qauke1wfo0unsp0
> ```

## Project Initialization

To initialize the project, clone the repository and install the dependencies with these commands:

```bat
git clone https://github.com/HendrikRauh/MSC-Backnang-Zeitnahme.git
cd MSC-Backnang-Zeitnahme
npm run update
```

## Prolific Driver

To use the Prolific Serial-to-USB device, install the driver from [here](https://www.prolific.com.tw/US/ShowProduct.aspx?p_id=225&pcid=41).

> **Note:** Install the driver and restart your system before connecting the device.

## Scripts for Easy Usage

To simplify the usage of the application, create a script to start the application. Create a new `.bat` file on your desktop and add the following code:

```bat
@echo off
cd MSC-Backnang-Zeitnahme
npm run easy-start --silent
```

For updating the application, create another `.bat` file with the following code:

```bat
@echo off
cd MSC-Backnang-Zeitnahme
npm run update --silent
```

> **Note:** Adjust the path to the project folder if you did not clone the repository to the desktop.
