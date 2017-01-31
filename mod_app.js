/**
 * Created by py on 1/19/17.
 */
var readlineSync = require('readline-sync');
var fs = require('fs');

var exit = false;


var fsStorage = [];
var flatSystem = [];
var root = {id      : 0,
            name    : 'root',
            type    : 'directory',
            children : []
};

fsStorage.push(root);

var currentFolderId = 0;
var lastId = 0;

var tmpFsStorage = [];
var tmpLastId = 0;

var menu = [
    'Print current folder',
    'Change current folder',
    'Create file or folder',
    'Delete file or folder',
    'Open file',
    'Write system to disc',
    'Read system from disc',
    'Quit Program'
];

var users = [
    { login : 1 , password : 111, permissions : 7 },       // create| delete | read
    { login : 2 , password : 222, permissions : 3 },       // delete | read
    { login : 3 , password : 333, permissions : 1 },       // read
    { login : 4 , password : 444, permissions : 0 }        // no permissions
];
var currentUser = 0;
const READ   = 1; //001
const DELETE = 2; //010
const CREATE = 4; //100

main();

function main() {
   // login();

    while(!exit) {
        showMenu();
    }
}

function login() {
    var userName  = readlineSync.question('Login :');
    var userPassword = readlineSync.question('Password :', { hideEchoBack: true });
    for(var i in users) {
        if(users[i].login == userName && users[i].password == userPassword){
            currentUser = i;
            return;
        }
    }
    console.log('Error! No such user');
    exit = true;
}

function checkPermission(mode){
    return users[currentUser].permissions & mode;
}

function showMenu() {


    var choise = readlineSync.keyInSelect(menu,'Please make your choise : ');

    switch(choise) {
        case 0 :
            printCurrentFolder();
            break;
        case 1 :
            changeCurrentFolder();
            break;
        case 2 :
            createFile();
            break;
        case 3 :
            deleteFile();
            break;
        case 4 :
            openFile();
            break;
        case 5 :
            saveSystemToFile();
            break;
        case 6 :
            readSystemFromFile();
            break;
        case 7 :
            quitProgram();
            break;
        default :
            break;
    }
}

function childId(folder,index) {
    return folder.children[index].id;
}

function childName(folder,index) {
    return folder.children[index].name;
}

function childType(folder,index) {
    return folder.children[index].type;
}

function childContent(folder,index) {
    return folder.children[index].content;
}

function addChild(folder,content) {

    folder.children.push(content);
}

function deleteChild(folder,index){
    folder.children.splice(index,1);
}

function findFolderInArray(array) {
    for(var i in array) {
        if(array[i].id == currentFolderId) {
            return array[i];
        } else {
            var resultFromChild = findFolderInArray(array[i].children);
            if(resultFromChild ) return resultFromChild;
        }
    }
}

function haveChildWithId(array, id) {
    for(var i in array) {
        if (array[i].id == id) return true;
    }
    return false;
}

function findFatherRecursevly(array) {
    for(var i in array) {
        if(haveChildWithId(array[i].children,currentFolderId)) {
            return array[i];
        } else {
            var resultFromChild = findFatherRecursevly(array[i].children);
            if(resultFromChild != 0) return resultFromChild;
        }
    }
    return 0;
}

function findCurrentFolder(){
    return findFolderInArray(fsStorage);
}

function findFather() {
    return findFatherRecursevly(fsStorage);

}

function printCurrentFolder() {

    var currentFolder = findCurrentFolder();

    console.log(currentFolder.name);

    for(var i in currentFolder.children) {
        if(childType(currentFolder,i) == 'directory') console.log('\t', childName(currentFolder,i), '\\');
    }

    for(var i in currentFolder.children) {
        if(childType(currentFolder,i) == 'file') console.log('\t', childName(currentFolder,i));
    }
}

function deleteFile() {
    if(!checkPermission(DELETE)){
        console.log('Error! You have now permission for this operation');
        return;
    }

    var fileName = readlineSync.question('Insert file/folder name :');

    var currentFolder = findCurrentFolder();

    for(var i in currentFolder.children) {
        if(childName(currentFolder,i) == fileName) {
            deleteChild(currentFolder,i);
            console.log(fileName,' deleted successfully');
            return;
        }
    }
    console.log('Error! No such file or directory');
}

function createFile() {
    if(!checkPermission(CREATE)){
        console.log('Error! You have now permission for this operation');
        return;
    }

    var fileName = readlineSync.question('Insert file/folder name :');

    var currentFolder = findCurrentFolder();

    for(var i in currentFolder.children) {
        if(childName(currentFolder,i) == fileName) {
            console.log('Error! File or folder with this name already existh in this folder');
            return;
        }
    }

    var content = readlineSync.question('Insert content ( if empty create folder) :');

    var newFile = { id : ++lastId, name : fileName };
    if(content == '') {
        newFile.children = [];
        newFile.type = 'directory';
    } else {
        newFile.content = content;
        newFile.type = 'file';
    }

    addChild(currentFolder,newFile);

    console.log(currentFolder.name);
    if(content == '') console.log('\t', newFile.name,'\\');
    else console.log('\t', newFile.name);
}

function changeCurrentFolder() {
    var folderName = readlineSync.question('Insert folder name or [..]  :');
    var found = false;

    if(folderName == '..') {
        if(currentFolderId == 0) {
            console.log('Error! You in the root');
            return;
        }
        currentFolderId = findFather().id;
        found = true;
    } else {
        var currentFolder = findCurrentFolder();
        for(var i in currentFolder.children) {
            if(childName(currentFolder,i) == folderName) {
                if (childType(currentFolder,i) == 'directory') {
                    currentFolderId = childId(currentFolder,i);
                    found = true;
                } else {
                    console.log('Error! ', folderName, ' is file name');
                    return;
                }
            }
        }
    }

    if(!found) console.log('Error! No such directory');
    printCurrentFolder();
}

function openFile() {
    if(!checkPermission(READ)){
        console.log('Error! You have now permission for this operation');
        return;
    }

    var fileName = readlineSync.question('Insert file name :');

    if(fileName == '') {
        console.log('Error! File name can not be empty.');
        return;
    }

    var currentFolder = findCurrentFolder();

    for(var i in currentFolder.children ) {
        if(childName(currentFolder,i) == fileName ) {
            if (childType(currentFolder,i) == 'file') {
                console.log('** ', childContent(currentFolder,i), ' **');
                return;
            } else {
                console.log('Error! ', folderName, ' is folder name');
            }
        }
    }
    console.log('Error! No such file in current directory');
}

function quitProgram() {
    do {
        var choice = readlineSync.question("Are you sure ? [y/n] :");
    } while(choice != 'y' && choice != 'n');
    if(choice == 'y') {
        exit = true;
        console.log("Have a good day!");
    }
}

function saveSystemToFile() {
    makeSystemFlat();

    try {
        fs.writeFileSync('file_system.txt', JSON.stringify(flatSystem));
    } catch(e) {
        console.log('Error! Problem writing system to file ');
        return;
    }
    console.log('System was writen successfully');
}

function readSystemFromFile() {
    tmpFsStorage = [];
    tmpLastId = 0;

    try {
        flatSystem = JSON.parse(fs.readFileSync('file_system.txt', 'UTF-8'));
//        checkUniqueIds();
        makeSystemTree();
        if(flatSystem.length > 0) throw new Error('Wrong data in file');
        fsStorage = tmpFsStorage;
        lastId = tmpLastId;
        currentFolderId = 0;
        console.log('System was red successfully');
    } catch(e) {
        console.log('Error! Could not read file, using current system');
        return;
    }
}

function makeSystemFlat() {
    var clone = {};
    flatSystem = [];

    for (var key in fsStorage[0]) {
        if(key != 'children') clone[key] = fsStorage[0][key];
    }
    clone['father'] = null;
    flatSystem.push(clone);
    putChildrensToFlat(fsStorage[0]);
}

function putChildrensToFlat( father) {

    father.children.forEach( function(node) {
         var clone = {};

         for (var key in node) {
            if(key != 'children') clone[key] = node[key];
         }
        clone['father'] = father['id'];
        flatSystem.push(clone);
        if(node.type == 'directory') putChildrensToFlat(node);
    });
}

function makeSystemTree() {
    if (flatSystem.length == 0) {
        tmpFsStorage.push(root);
        return;
    }

    for (var i = 0; i < flatSystem.length; i++) {
        if (flatSystem[i].id == 0) {  // find root
            nodeTreatment(tmpFsStorage, flatSystem[i]);
            flatSystem.splice(i,1);
            break;
        }
    }
    if (!tmpFsStorage[0]) throw new Error('Wrong fields');
    addToSystemTreeChilds(tmpFsStorage[0]);
}

function nodeTreatment(container,node) {
    if(!checkFields(node)) throw new Error('Wrong fields');
    delete node.father;
    if(node.type == 'directory') node['children'] = [];
    container.push(node);
    updateLastId(node.id);
}

function updateLastId(newId) {
    lastId = newId > lastId ? newId : lastId;
}

function addToSystemTreeChilds(father) {
    for(var i = 0; i < flatSystem.length; i++) {
        var node = flatSystem[i];
        if(node['father'] == father['id']) {
            nodeTreatment(father.children,node);
            flatSystem.splice(i,1);
            i--; // next element move one position
            if(node.type == 'directory') addToSystemTreeChilds(child);
        }
    }
}

function checkFields(node) {
    return 'id' in node && 'father' in node && 'type' in node &&
        ((node.type == 'file' && 'content' in node ) || node.type == 'directory');
}

function checkUniqueIds() {
    var tmp = [];
    for(var i = 0; i < flatSystem.length; i++) {
        if (!flatSystem[i]['id'])
            if( tmp.includes(flatSystem[i][id]))
                throw new Error('Not unique id');
        tmp.push(flatSystem[i][id]);
    }
}