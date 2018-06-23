'use strict';

const Machine = require('..')

Machine.create('test', (err) => {
  if (err) throw err
  else console.log("machine 'test' created successfully!");
});

const options = {
  "driver": "virtualbox",
  "virtualbox-memory": "1024"
};

Machine.create('test2', options, (err) => {
  if (err) throw err
  else console.log("machine 'test2' created successfully!");
});