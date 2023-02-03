'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */

const fs = require('fs');
const path = require('path');

function exportAsHtml(markdownTemplate, jsonData, dotGraphs) {

    let data = {
        markdownTemplate:markdownTemplate,
        jsonData:jsonData,
        dotGraphs:dotGraphs
    };

    const packageRoot = __dirname + '/../..';

    let result = {'index':'', 'js':[], 'css':[] };
    let srcFiles = [
        'index.html',
        
        path.join('js', 'Chart.bundle.min.js'), 
        path.join('js', 'chartjs-plugin-colorschemes.min.js'), 

        
        path.join('js', 'showdown.min.js'), 
        path.join('js', 'showdown-table.min.js'), 
        path.join('css','github-markdown.css'),
        
        path.join('js', 'd3graphviz', 'viz.js'), 
        path.join('js', 'd3graphviz', 'd3.min.js'), 
        path.join('js', 'd3graphviz', 'd3-graphviz.min.js'), 
        
        'main.js', 
    ];
            
    srcFiles.forEach(f => {
        switch(f.split('.').pop()){
            case 'js': result.js.push(fs.readFileSync(path.join(packageRoot, "content", f), "utf8")); break;
            case 'html': result.index = fs.readFileSync(path.join(packageRoot, "content", f), "utf8"); break;
            case 'css': result.css.push(fs.readFileSync(path.join(packageRoot, "content", f), "utf8")); break;
        }
    });

    result.index = result.index
        .replace(/<script .*?src="(.+)"><\/script>/g,"")
        .replace(/<link.*\/>/g,"")
        .replace(/<!-- .* -->/g, "")
        .replace(/\s{5,}/g,'');

    let staticJsCss = `
        <style>
            ${result.css.join("\n<!-- -->\n")}
        </style>
        <script>
            ${result.js.join("\n</script><script>\n")}
        </script>
        <script>
            let staticMetrics = ${JSON.stringify(data)};

            window.addEventListener('load', function() {
                window.postMessage({"command":"renderReport", value:staticMetrics}, '*')
            });
        </script>`;
    
    return result.index.replace("<!--/*** %%static_metrics%% ***/-->", staticJsCss);
}


function capitalFirst(string) 
{
    if(!string.length) {
        return "";
    } else if(string.length==1){
        return string.toUpperCase();
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
    capitalFirst,
    exportAsHtml
};