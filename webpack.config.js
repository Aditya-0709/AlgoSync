// Webpack configuration for AlgoSync extension
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import FileManagerPlugin from 'filemanager-webpack-plugin';
// https://stackoverflow.com/a/62892482/
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extensionVersion = process.env.npm_package_version;

// Ignore when copying
const ignore = [
  // non-essential
  '**/dist/**',
  '**/.prettierrc',
  '**/.eslintrc',
  '**/.env',
  '**/assets/.DS_Store',
  '**/package*',
  '**/webpack*',
  '**/README.md',
  '**/assets/extension', // web store assets
  // webpack compiled files and source modules
  '**/scripts/content.js',
  '**/scripts/core/**',
  '**/scripts/platforms/**',
  '**/scripts/leetcode/**',
  '**/scripts/gfg.js',
  '**/scripts/welcome.js',
  '**/scripts/popup.js',
  '**/scripts/jquery-3.3.1.min.js',
  '**/scripts/semantic-2.4.1.min.js',
  '**/manifest-chrome.json',
  '**/manifest-firefox.json',
  '**/src/**',
  '**/postcss.config.cjs',
  '**/tailwind.config.cjs',
];

const folderIgnore = [
  '**/chrome/**',
  '**/firefox/**',
  '**/manifest.json',
];

const manifestTransform = content => {
  const filteredContent = content
    .toString()
    .split('\n')
    .filter(str => !str.trimStart().startsWith('//'))
    .join('\n');

  const manifestData = JSON.parse(filteredContent);
  manifestData.version = extensionVersion;
  return JSON.stringify(manifestData, null, 2);
};

export default {
  entry: {
    content: path.resolve(__dirname, 'scripts', 'content.js'),
    welcome: './scripts/welcome.js',
    popup: './src/popup/index.jsx',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  watchOptions: {
    ignored: '**/dist/**',
  },
  optimization: {
    minimize: false,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(test)|(spec)\.js$/,
        use: 'ignore-loader',
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: './scripts',
          to: './scripts',
          globOptions: {
            ignore,
          },
        },
        {
          from: '*',
          globOptions: {
            gitignore: true,
            ignore,
          },
        },
        {
          from: './manifest-chrome.json',
          to: './manifest.json',
          transform: manifestTransform,
        },
        {
          from: './manifest-chrome.json',
          to: './chrome/manifest.json',
          transform: manifestTransform,
        },
        {
          from: './manifest-firefox.json',
          to: './firefox/manifest.json',
          transform: manifestTransform,
        },
        {
          from: 'assets/**',
          globOptions: {
            ignore: [
              ...ignore,
              './assets/.DS_Store'
            ],
          },
        },
        {
          from: 'css',
          to: 'css',
          globOptions: {
            ignore,
          },
        },
      ],
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          move: [
            {
              source: './dist/content.js',
              destination: './dist/scripts/content.js',
            },
            {
              source: './dist/welcome.js',
              destination: './dist/scripts/welcome.js',
            },
            {
              source: './dist/popup.js',
              destination: './dist/scripts/popup.js',
            },
          ],
          copy: [ // Copy everything to chrome and firefox
            {
              source: './dist/**',
              destination: './dist/chrome',
              globOptions: {
                ignore: folderIgnore,
              },
            },
            {
              source: './dist/**',
              destination: './dist/firefox',
              globOptions: {
                ignore: folderIgnore,
              },
            },
          ],
        },
      },
    }),
  ],
};
