import fs = require('fs')

export async function readFileAsync(path: string){
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if(err){
        return reject(err)
      }

      return resolve(data)
    })
  })
}