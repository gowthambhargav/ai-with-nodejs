import 'dotenv/config'
import { openai } from "./openai.js";
import math from 'advanced-calculator';

const QUESTION = process.argv[2] || 'hi'



const messages = [
    {
      role: 'user',
      content: QUESTION,
    },
  ]


  const functions = {
    calculate:async ({expression})=>{
        return math.evaluate(expression)
    },
  }


const getCompletion = (messages)=>{
    return openai.chat.completions.create({
        model:'gpt-3.5-turbo-0613',
        messages,
        temperature:0,
        // function_call:{name:'calcuate'},
        functions:[{
            name:'calculate',
            description:'run math expressions',
            parameters:{
                type:'object',
                properties:{
                    expression:{
                        type:'string',
                        description:'Then math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"'
                    }
                },
                required:['expression']
            }
        }]
    })
}

let respons ;
while(true){
    respons = await getCompletion(messages)

    if (respons.choices[0].finish_reason === 'stop') {
        console.log(respons.choices[0].message.content);
        break
    }else if (respons.choices[0].finish_reason === 'function_call') {
        const fName = respons.choices[0].message.function_call.name;
        const args = respons.choices[0].message.function_call.arguments;
        const funcTCall = functions[fName]
        const params = JSON.parse(args)

        const results = funcTCall(params)
        messages.push({
            role:'assistant',
            content:null,
            function_call:{
                name:fName,
                arguments:args,
            }
        })
        messages.push(
            {
                role:'function',
                name:fName,
                content:JSON.stringify({results})
            }
        )
    }
}
