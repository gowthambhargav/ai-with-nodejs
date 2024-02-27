import 'dotenv/config'
import  './openai.js'
import {Document} from 'langchain/document'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
// import {OpenAIEmbeddings} from 'langchain/embeddings/openai'
import {OpenAIEmbeddings} from "@langchain/openai"
import {CharacterTextSplitter} from "langchain/text_splitter"
import {PDFLoader} from 'langchain/document_loaders/fs/pdf'
import {YoutubeLoader} from 'langchain/document_loaders/web/youtube'
import { openai } from './openai.js'

const question = process.argv[2]
const video = 'https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn'
  
const createStore = (docs)=>{
  return  MemoryVectorStore.fromDocuments(docs,new OpenAIEmbeddings({openAIApiKey:process.env.OPEN_AI_KEY}))
}

const docsFromYTVideo = (video)=>{
    const loder = YoutubeLoader.createFromUrl(video,{
        language:'en',
        addVideoInfo:true,
    })
    return loder.loadAndSplit(
        new CharacterTextSplitter({
            separator:' ',
            chunkSize:2500,
            chunkOverlap:100
        })
    )
}


const docsFromPDF = ()=>{
    const loder = new PDFLoader('xbox.pdf')
    return loder.loadAndSplit(
        new CharacterTextSplitter({
            separator:'. ',
            chunkSize:2500,
            chunkOverlap:200
        })
    )
}


const loadStore = async ()=>{
    const  videoDocs = await docsFromYTVideo(video)
    // console.log('videoDocs:', videoDocs);
    const  pdfDocs = await docsFromPDF() 
    // console.log('pdfDocs:', pdfDocs);
    return createStore([...videoDocs,...pdfDocs])
}



const query = async ()=>{
    const store = await loadStore()
    // console.log('store:', store);
    if (!store) {
        throw new Error('Store is not loaded');
    }
    const result = await store.similaritySearch(question,2)
    const response = await openai.chat.completions.create({
        model:'gpt-3.5-turbo-16k',
        temperature:0,
        messages:[
            {
                role:'system',
                content:'you are an ai assistant, answer any questions to the best of your ability'
            },
            {
                role:'user',
                content:`Answer the following question using the provided context. If you cannot answer the question with the context, don't lie and make up stuff. Just say you need more context.
                Question: ${question}
                Context:${result.map((r) => r.pageContent).join('\n')}
                `
            }
        ]
    })
    console.log(`Answer:${response.choices[0].message.content}\nSources:
    ${result.map(r=>r.metadata.source).join(',')}`);
}

query()
