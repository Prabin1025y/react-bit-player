# react-bit-player

A custom React video player component built with TypeScript, React, and Webpack.  
Designed for easy integration into React projects with full TypeScript support.

---

## Features

- Simple and customizable React video player component  
- Supports subtitles, custom controls, and multiple video formats  
- TypeScript typings included  
- Peer dependencies on React and ReactDOM to avoid bundle duplication

---

## Installation

```bash
npm install react-bit-player
```

or with yarn:

```bash
yarn add react-bit-player
```

---

## Usage

```tsx
import React from 'react';
import ReactBitPlayer from 'react-bit-player';

function App() {
  return (
    <div>
      <h1>My Video Player</h1>
      <ReactBitPlayer
        url="https://example.com/video.mp4"
        
        // Add other supported props here
      />
    </div>
  );
}

export default App;
```

---

## Peer Dependencies

Make sure your project has compatible versions of React and ReactDOM installed:

```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

---

## Development

To build the package locally:

```bash
npm run build
```

This compiles the TypeScript declaration files and bundles the component for publishing.

To run the development server:

```bash
npm start
```

---

## License

MIT © Prabin Acharya

---

## Repository

[GitHub Repository](https://github.com/Prabin1025y/react-bit-player)

---

Feel free to contribute or open issues!

