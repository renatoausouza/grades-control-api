import express from 'express';
import winston from 'winston';
import gradesRouter from './grades.js';
import { promises as fs } from 'fs';
import cors from 'cors';

const { readFile, writeFile } = fs;
const { combine, printf, label, timestamp } = winston.format;

const myFormart = printf(({ level, message, label, timestamp }) => {
  return `${timestamp}[${label}] ${level}: ${message}`;
});
global.fileName = 'grades.json';
global.logger = winston.createLogger({
  level: 'silly',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'my-grades-control-api.log',
    }),
  ],
  format: combine(
    label({ label: 'my-grades-control-api' }),
    timestamp(),
    myFormart
  ),
});

const app = express();
app.use(express.json());
app.use(cors());
app.use('/grade', gradesRouter);
app.listen(3000, async () => {
  const initialJson = {
    nextId: 1,
    grades: [],
  };
  try {
    await readFile('grades.json');
    global.logger.info('My Grades API started!');
  } catch (erro) {
    writeFile('grades.json', JSON.stringify(initialJson, null, 2))
      .then(() => {
        global.logger.info('My Grades API started!');
      })
      .catch((err) => {
        global.logger.error(err);
      });
  }
});
