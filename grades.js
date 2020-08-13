import express from 'express';
import { promises as fs } from 'fs';

const router = express.Router();
const { readFile, writeFile } = fs;

router.put('/', async (req, res, next) => {
  try {
    let grade = req.body;
    const data = await readJson(global.fileName);
    const index = data.grades.findIndex((gradeOld) => gradeOld.id === grade.id);

    if (
      !grade.id ||
      !grade.student ||
      !grade.subject ||
      !grade.type ||
      grade.value == null
    ) {
      throw new Error('Id, student, subject, type and value are required');
    } else if (index === -1) {
      throw new Error('Id not found');
    } else {
      grade = {
        id: grade.id,
        student: grade.student,
        type: grade.type,
        value: parseInt(grade.value),
        timestamp: new Date(),
      };
      data.grades[index] = grade;

      await writeJson(global.fileName, data);
      global.logger.info('PUT /grade');
      res.send(grade);
    }

    const grades = await readJson(global.fileName);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    let grade = req.body;

    if (
      !grade.student ||
      !grade.subject ||
      !grade.type ||
      grade.value == null
    ) {
      throw new Error('Student, subject, type and value are required');
    } else {
      const data = await readJson(global.fileName);

      grade = {
        id: data.nextId,
        student: grade.student,
        type: grade.type,
        value: parseInt(grade.value),
        timestamp: new Date(),
      };
      data.nextId++;
      data.grades.push(grade);

      await writeJson(global.fileName, data);
      global.logger.info('POST /grade');
      res.send(grade);
    }

    const grades = await readJson(global.fileName);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const data = await readJson(global.fileName);
    const grade = data.grades.find(
      (grade) => grade.id === parseInt(req.params.id)
    );
    data.grades = data.grades.filter(
      (grade) => grade.id !== parseInt(req.params.id)
    );

    await writeJson(global.fileName, data);
    global.logger.info('DELETE /grade/:id');
    res.send(grade);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await readJson(global.fileName);
    const grade = data.grades.find(
      (grade) => grade.id === parseInt(req.params.id)
    );
    if (grade == null) {
      throw new Error('Grade not found');
    } else {
      global.logger.info('GET /grade/:id');
      res.send(grade);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/totalScore/:student/:subject', async (req, res, next) => {
  try {
    let student = req.params.student;
    let subject = req.params.subject;

    const data = await readJson(global.fileName);
    const grades = data.grades.filter(
      (grade) => grade.student === student && grade.subject === subject
    );

    let sum = grades.reduce((accum, curr) => {
      return (accum += curr.value);
    }, 0);

    let result = {
      student: student,
      subject: subject,
      totalScore: sum,
    };

    res.send(result);
  } catch (err) {
    next(err);
  }
});

router.get('/avaregeScore/:subject/:type', async (req, res, next) => {
  try {
    let subject = req.params.subject;
    let type = req.params.type;

    const data = await readJson(global.fileName);
    const grades = data.grades.filter(
      (grade) => grade.subject === subject && grade.type === type
    );

    let sum = grades.reduce((accum, curr) => {
      return (accum += curr.value);
    }, 0);

    let avarege = sum / grades.length;

    let result = {
      subject: subject,
      type: type,
      avaregeScore: avarege,
    };

    res.send(result);
  } catch (err) {
    next(err);
  }
});

router.get('/bestGrades/:subject/:type', async (req, res, next) => {
  try {
    let subject = req.params.subject;
    let type = req.params.type;

    const data = await readJson(global.fileName);
    const grades = data.grades.filter(
      (grade) => grade.subject === subject && grade.type === type
    );

    let top3 = [];

    grades.sort((a, b) => {
      return b.value - a.value;
    });

    for (let i = 0; i < 3; i++) {
      top3.push(grades[i]);
    }

    res.send(JSON.stringify(top3));
  } catch (err) {
    next(err);
  }
});

async function readJson(filename) {
  const data = await readFile(global.fileName);
  const jsonGrades = JSON.parse(data);
  return jsonGrades;
}

async function writeJson(filename, json) {
  await writeFile(filename, JSON.stringify(json, null, 2));
}

router.use((err, req, res, next) => {
  global.logger.error(`${req.method} ${req.baseUrl} -  ${err.message}`);
  res.status(400).send({ erro: err.message });
});

export default router;
