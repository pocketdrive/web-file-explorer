(function(angular) {
    'use strict';
    angular.module('FileManagerApp').provider('fileManagerConfig', function() {
        var values = {
            appName: 'angular-filemanager v1.5',
            defaultLang: 'en',

            apiUrl: 'localhost',
            apiPort: '8080',
            linkSharePort: '4200',
            activeUser: 'anuradha',
            activeDevice: 'PD',

            listUrl: '/file/list', ///file/list
            uploadUrl: '/file/upload',
            renameUrl: '/file/rename',
            copyUrl: '/file/copy',
            moveUrl: 'bridges/php/handler.php',
            removeUrl: 'bridges/php/handler.php',
            editUrl: 'bridges/php/handler.php',
            getContentUrl: 'bridges/php/handler.php',
            createFolderUrl: 'bridges/php/handler.php',
            downloadFileUrl: '/file/download',
            downloadMultipleUrl: 'bridges/php/handler.php',
            compressUrl: 'bridges/php/handler.php',
            extractUrl: 'bridges/php/handler.php',
            permissionsUrl: 'bridges/php/handler.php',
            basePath: '/',

            searchForm: true,
            sidebar: true,
            breadcrumb: true,
            allowedActions: {
                upload: true,
                rename: true,
                move: true,
                copy: true,
                edit: true,
                changePermissions: true,
                compress: true,
                compressChooseName: true,
                extract: true,
                download: true,
                downloadMultiple: true,
                preview: true,
                remove: true,
                createFolder: true,
                pickFiles: false,
                pickFolders: false
            },

            multipleDownloadFileName: 'pocket-drive-download.zip',
            filterFileExtensions: [],
            showExtensionIcons: true,
            showSizeForDirectories: false,
            useBinarySizePrefixes: false,
            downloadFilesByAjax: true,
            previewImagesInModal: true,
            enablePermissionsRecursive: true,
            compressAsync: false,
            extractAsync: false,
            pickCallback: null,

            isEditableFilePattern: /\.(txt|diff?|patch|svg|asc|cnf|cfg|conf|html?|.html|cfm|cgi|aspx?|ini|pl|py|md|css|cs|js|jsp|log|htaccess|htpasswd|gitignore|gitattributes|env|json|atom|eml|rss|markdown|sql|xml|xslt?|sh|rb|as|bat|cmd|cob|for|ftn|frm|frx|inc|lisp|scm|coffee|php[3-6]?|java|c|cbl|go|h|scala|vb|tmpl|lock|go|yml|yaml|tsv|lst)$/i,
            isImageFilePattern: /\.(jpe?g|gif|bmp|png|svg|tiff?)$/i,
            isExtractableFilePattern: /\.(gz|tar|rar|g?zip)$/i,
            tplPath: 'src/templates'
        };

        return {
            $get: function() {
                return values;
            },
            set: function (constants) {
                angular.extend(values, constants);
            }
        };

    });
})(angular);
