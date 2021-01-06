'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */

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
    capitalFirst
};