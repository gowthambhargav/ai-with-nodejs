import 'dotenv/config'
import {openai} from './openai.js'
import {Document} from 'langchain/document'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
// import {OpenAIEmbeddings} from 'langchain/embeddings/openai'
import {OpenAIEmbeddings} from "@langchain/openai"
import {CharacterTextSplitter} from "langchain/text_splitter.js"
import {PDFLoader} from 'langchain/document_loaders/fs/pdf'
import {YoutubeLoader} from 'langchain/document_loaders/web/youtube'

const question = process.argv[2]
const video = 'https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn'
  
const createStore = (docs)=>{
    MemoryVectorStore.fromDocuments(docs,new OpenAIEmbeddings({openAIApiKey:process.env.OPEN_AI_KEY }))
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
    const loder = new PDFLoader.apply('xbox.pdf')
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
   
    const  pdfDocs = await docsFromPDF() 
    console.log(videoDocs[0],pdfDocs[0]);
    return createStore([...videoDocs,...pdfDocs])
}



const query = async ()=>{
    const store = await loadStore()
    const result = await store.similaritySearch(question, 2)
    console.log(result);
}

query()
