import React, {useEffect, useState} from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const BASE_API_URL = 'http://localhost:5000/api/v1';
  const [documents, updateDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = () => {
    axios.get(`${BASE_API_URL}/documents`).then(response => {
      updateDocuments(response.data);
    });
  }

  const createDocument = (name, contentType) => {
    const data = {
      name: name,
      content_type: contentType
    };

    axios.post(`${BASE_API_URL}/documents`, data).then(response => {
      updateDocuments(documents => [...documents, response.data]);
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

      axios.post(`${BASE_API_URL}/presigned_urls`, data).then(response => {
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
          <a href={document.url} target="_blank" rel="noopener noreferrer">{document.name}</a>
        </div>
      )
    });
  }

  return (
    <div className="main">
      <div className="documents-list">
        <h3>Documents</h3>
        {renderDocuments()}
      </div>
      <input type="file" multiple="multiple" onChange={handleFilesUpload}/>
    </div>
  );
}

export default App;
