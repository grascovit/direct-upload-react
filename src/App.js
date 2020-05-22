import React, {useEffect, useState} from 'react';
import axios from 'axios';
import './App.css';
import spinner from './spinner.gif';

function App() {
  const [documents, updateDocuments] = useState([]);
  const [isLoading, toggleIsLoading] = useState(false);
  const [isUploading, toggleIsUploading] = useState(false);
  const [error, updateError] = useState(undefined);
  const [deltaTime, updateDeltaTime] = useState(undefined);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = () => {
    toggleIsLoading(true);

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/documents`).then(response => {
      updateDocuments(response.data);
      toggleIsLoading(false);
    });
  }

  const createDocument = (name, contentType) => {
    const data = {
      name: name,
      content_type: contentType
    };

    return axios.post(`${process.env.REACT_APP_API_BASE_URL}/documents`, data).then(response => {
      updateDocuments(documents => [...documents, response.data]);
    });
  }

  const uploadFileToS3 = (file, url, fields) => {
    const formData = new FormData();

    for (var key in fields) {
      formData.append(key, fields[key]);
    }

    formData.append('file', file);

    return axios.post(url, formData).then(() => {
      return createDocument(file.name, file.type);
    });
  }

  const getPresignedUrl = (file) => {
    const data = {
      name: file.name,
      content_type: file.type
    }

    return axios.post(`${process.env.REACT_APP_API_BASE_URL}/presigned_urls`, data).then(response => {
      const url = response.data.url;
      const fields = response.data.fields;

      return uploadFileToS3(file, url, fields);
    });
  }

  const handleFilesUpload = (event) => {
    const promises = [];
    const files = event.target.files;

    toggleIsUploading(true);
    const start = Date.now();

    Array.from(files).forEach(file => {
      promises.push(getPresignedUrl(file));
    });

    Promise.all(promises).catch(() => {
      updateError('There was a problem while trying to upload your file(s). Please try again.');
    }).finally(() => {
      toggleIsUploading(false);
      updateDeltaTime(((Date.now() - start) / 1000).toFixed(2));
    });
  }

  const renderDocuments = () => {
    if (isLoading) {
      return <img className="spinner" alt="Spinner" src={spinner}/>
    }

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
      {
        isUploading ? <img className="spinner spinner-upload" alt="Spinner" src={spinner}/> : ''
      }
      {
        deltaTime ? <p>Finished in {deltaTime}s</p> : ''
      }
      {
        error ? <p className="error">{error}</p> : ''
      }
    </div>
  );
}

export default App;
