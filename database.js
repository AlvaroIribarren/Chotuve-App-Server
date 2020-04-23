const {Pool} = require('pg');

const config = {
    user: 'postgres',
    host: 'localhost',
    password: 'pass',
    database: 'library'
};

const pool = new Pool(config);

const getUsers = async () => {
    try {
        const books = await pool.query('select * from users');
        console.log(books.rows)
        return books.rows;
    } catch(e){
        console.log(e);
    }
}

async function getUserById (id)  {
    let users = await getUsers();
    return users.find(user => user.id === id);
}


async function insertUser(nameReceived, passwordReceived) {
    try {
        const text = 'INSERT INTO users(username, password) VALUES($1, $2)';
        const values = [nameReceived, passwordReceived];
        const result = await pool.query(text, values);
        console.log(result);
        pool.end();
    } catch (e){
        console.log(e);
    }
}

const deleteUser = async () => {
    try {
        const text = 'DELETE FROM users WHERE username = $1';
        const values = ['manuel']
        const res = await pool.query(text, values);
        console.log(res);
        pool.end();
    } catch (e){
        console.log(e);
    }
}

const editUser = async () => {
    try {
        const text = 'UPDATE users SET username = $1 WHERE username = $2';
        const values = ['Jhon', 'Juan'];
        const res = await pool.query(text, values);
        console.log(res);
        pool.end();
    } catch (e){
        console.log(e);
    }
}

async function print(){
    const res = await getUserById('Foundation');
    console.log("Buscaste el libro con titulo: " + res.title + " su autor es: " + res.author);
}

module.exports = {
    getUser : getUserById,
    insertUser : insertUser
};