const fs = require('fs');
const util = require('util');

const FILE_NAME = "test.txt";
const PART_COUNT = 1000;

const processFile = async (fileName, partCount = 10) => {
    console.log('Checking file', fileName);
    try {
        const { size } = await util.promisify(fs.stat)(fileName);
        console.log("fileSize:", size, "to be divided in parts:", partCount);

        const offset = Math.floor(size / partCount);
        console.log("Chunksize", offset);

        let start = 0;
        let count = 0;

        console.time('SPLIT_TIME_TAKEN');

        while (count < partCount) {
            ++count;
            let end = start + offset - 1;
            if (count === partCount) end = size;
            console.log('Working on piece #', count, "start:", start, "end:", end);
            const readStream = fs.createReadStream(
                fileName,
                { encoding: 'binary', start, end }
            );

            const writeStream = fs.createWriteStream(`${fileName}.PART-${count}`);

            await new Promise((res, rej) =>
                readStream
                    .pipe(writeStream)
                    .on('finish', res)
                    .on('error', rej)
            );

            start += offset;
        }

        console.timeEnd('SPLIT_TIME_TAKEN');
    } catch (err) {
        console.log(err);
    }
}

processFile(FILE_NAME, PART_COUNT);