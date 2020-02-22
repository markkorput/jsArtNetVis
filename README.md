# jsArtNetVis
node.js based artnet receiver/visualizer

## WIP
The code in this repository is unpolished and hacked together with the goal to debug the artnet output of specifically [MadMapper's minimad](https://madmapper.com/minimad/) without requiring the physical installation or DMX fixtures that are eventually gonna be hooked up as artnet receivers.

## Usage

### Install dependencies
```bash
yarn
```

or

```bash
npm install
```

### Run the example scripts

Dump ArtNet data to stdout:

```bash
node example_dump
```

Run an express webserver that serves static UI files and a websocket server that transmits incoming artnet to the UI Client. The client visualizes the artnet using WebGL.

```bash
node example_ws
```

```bash
open http://localhost:8080
```