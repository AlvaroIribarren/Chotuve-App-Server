create database library;

create table users(
    id serial PRIMARY KEY,
    name text UNIQUE NOT NULL,
    password text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text UNIQUE NOT NULL,
    profileimgurl text NOT NULL
);

create table videos(
    id serial PRIMARY KEY NOT NULL,
    author_id serial NOT NULL,
    author_name text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    location text NOT NULL,
    public bit NOT NULL,
    url text UNIQUE NOT NULL
);

create table requests(
    id serial PRIMARY KEY NOT NULL,
    senderid serial NOT NULL,
    receiverid serial NOT NULL
);

create table comments(
    id serial PRIMARY KEY NOT NULL,
    author_id serial NOT NULL,
    author_name text NOT NULL,
    video_id serial NOT NULL,
    comment text NOT NULL
);

create table opinions(
    id serial PRIMARY KEY NOT NULL,
    author_id serial NOT NULL,
    author_name text NOT NULL,
    video_id serial NOT NULL,
    positive_opinion bit NOT NULL
);

insert into users values
    (1, 'Alvaro', 'a123'),
    ('Juan', 'j123'),
    ('Pedro', 'p123');

