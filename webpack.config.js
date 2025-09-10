const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: './src/client/js/index.js',
    output: {
        path: path.resolve(__dirname + '/dist'),
        filename: './js/bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/client/index.html'
        }),
        new MiniCssExtractPlugin({
            filename: './css/styles.css'
        })
    ],
    mode: 'development',
    watch: true,
    watchOptions: {
        ignored: [
            path.resolve(__dirname + '/node_modules'),
            path.resolve(__dirname + '/dist'),
            path.resolve(__dirname + '/src/server')
        ],
        aggregateTimeout: 200
    },
    devtool: 'source-map'
};