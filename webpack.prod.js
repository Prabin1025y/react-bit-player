// const path = require('path');

// module.exports = {
//   mode: 'production',
//   entry: './src/index.ts', // This should export your Player component
//   output: {
//     path: path.resolve(__dirname, 'dist'),
//     filename: 'index.js',
//     library: {
//       type: 'module',
//     },
//     clean: true,
//   },
//   experiments: {
//     outputModule: true,
//   },
//   resolve: {
//     extensions: ['.ts', '.tsx', '.js', '.jsx'],
//   },
//   externals: {
//     react: 'react',
//     'react-dom': 'react-dom',
//   },
//   module: {
//     rules: [
//       {
//         test: /\.[jt]sx?$/,
//         exclude: /node_modules/,
//         use: 'babel-loader',
//       },
//       {
//         test: /\.module\.css$/,
//         use: [
//           'style-loader',
//           {
//             loader: 'css-loader',
//             options: {
//               modules: true,
//             },
//           },
//         ],
//       },
//       {
//         test: /\.css$/,
//         exclude: /\.module\.css$/,
//         use: ['style-loader', 'css-loader'],
//       }
//     ],
//   }
// };

const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.ts', // Changed from .ts to .tsx since you mentioned index.tsx
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      type: 'module',
    },
    clean: true,
  },
  experiments: {
    outputModule: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  externals: {
    'react': 'react',
    'react-dom': 'react-dom',
    // Add your other dependencies as externals to reduce bundle size
    'lucide-react': 'lucide-react',
    'react-icons': 'react-icons',
    'react-player': 'react-player',
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },
  optimization: {
    splitChunks: false, // This prevents code splitting
    minimize: true,
  },
  performance: {
    hints: false, // Disable bundle size warnings
  },
};
