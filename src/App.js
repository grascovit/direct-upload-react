import React, {useState} from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [documents, setDocuments] = useState([]);

  const createDocument = (name, contentType) => {
    const data = {
      name: name,
      content_type: contentType
    };

    axios.post('http://localhost:5000/api/v1/documents', data).then(response => {
      setDocuments(documents => [...documents, response.data]);
    });
  }

  const uploadFileToS3 = (file, url, fields) => {
    const formData = new FormData();

    for (var key in fields) {
      formData.append(key, fields[key]);
    }

    formData.append('file', file);

    axios.post(url, formData).then(response => {
      createDocument(file.name, file.type);
    })
  }

  const handleFilesUpload = (event) => {
    const files = event.target.files;

    Array.from(files).forEach(file => {
      const data = {
        name: file.name,
        content_type: file.type
      }

      axios.post('http://localhost:5000/api/v1/presigned_urls', data).then(response => {
        const url = response.data.url;
        const fields = response.data.fields;

        uploadFileToS3(file, url, fields);
      });
    });
  }

  const renderDocuments = () => {
    return documents.map(document => {
      return (
        <div key={document.id} className="document">
          <p>ID: {document.id}</p>
          <p>Name: {document.name}</p>
          <p>Content Type: {document.content_type}</p>
        </div>
      )
    });
  }

  return (
    <div className="main">
      <input type="file" multiple="multiple" onChange={handleFilesUpload}/>
      <div className="documents-list">
        {renderDocuments()}
      </div>
    </div>
  );
}

export default App;
