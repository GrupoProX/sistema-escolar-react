import React, { cloneElement, useDebugValue, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import FolderIcon from '@material-ui/icons/Folder';
import DeleteIcon from '@material-ui/icons/Delete';
import { studentsRef } from '../services/storageRefs';
import { formatBytes } from './FunctionsUse';
import { storage } from '../services/firebase';
import { Box, Button } from '@material-ui/core';
import ShowFiles from './ShowFiles';
import { CloudUpload, Refresh } from '@material-ui/icons';
import { useSnackbar } from 'notistack';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    maxWidth: 752,
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
    
  },
  title: {
    margin: theme.spacing(4, 0, 2),
  },
  list: {
    height: "55vh",
    overflow: 'auto',
  },
}));



export default function StudentFiles(props) {
  const classes = useStyles();
  const { studentId } = props;
  const [dense, setDense] = useState(false);
  const [secondary, setSecondary] = useState(true);
  const [studentFiles, setStudentFiles] = useState([]);
  const [ filesList, setFilesList ] = useState()
  const [ openFile, setOpenFile ] = useState(false)
  const [ url, setUrl ] = useState()
  const [ totalFilesSize, setTotalFilesSize ] = useState('0 B')

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();


  const getData = async () => {
    let filesArray = []
    return studentsRef.child(studentId).child('arquivos').listAll().then(res => {
      res.items.forEach(async (item) => {
        let metadata = await item.getMetadata()
        filesArray.push({name: item.name, fullPath: item.fullPath, metadata: metadata})
        
      })
      return filesArray
    })
    // setStudentFiles(res.items)

  }
  useEffect(() => {
    
    getData().then(filesArray => {
      setStudentFiles(filesArray)
    })
  }, [studentId])

  const handleOpenFile = async (fullPath) => {
    let url = await storage.ref(fullPath).getDownloadURL();
    console.log(url);
    setOpenFile(true)
    setUrl(url)
  }
  

  const handleCloseFile = () => {
    setOpenFile(false);
  }

  const handleDeleteFile = async (filePath) => {
    try {
      await storage.ref(filePath).delete()
      enqueueSnackbar('Arquivo deletado', {variant: 'success'})
      getData().then(filesArray => {
        setStudentFiles(filesArray)
        
      })
    } catch (error) {
      enqueueSnackbar(error.message, {variant: 'error'})
    }
    
  }

  const handleUploadFile = async (e) => {
    const files = e.target.files
    console.log(files)
    let filesArray = []
    for (const file of files) {
      filesArray.push(file)
    }
    Promise.all(
        filesArray.map(file => putStorageItem(file))
    )
    .then((url) => {
      console.log(`All success`, url)
      getData().then(filesArray => {
        setStudentFiles(filesArray)
        
      })
      enqueueSnackbar('Upload concluído com sucesso', {variant: 'success'})
    })
    .catch((error) => {
      console.log(`Some failed: `, error.message)
      enqueueSnackbar(error.message, {variant: 'error'})
    });

    
  
    
    function putStorageItem(item) {
      // the return value will be a Promise
      return studentsRef.child(studentId).child('arquivos').child(item.name).put(item)
      .then((snapshot) => {
        console.log('One success:', item)
        enqueueSnackbar(`${item.name} enviado com sucesso`, {variant: 'info'})
      }).catch((error) => {
        console.log('One failed:', item, error.message)
      });
    }
  }

  const calculateTotalSize = () => {

    let bytes = 0
    studentFiles && studentFiles.map((file, i) => {
      bytes += Number(file.metadata.size)
    })

    let total = formatBytes(bytes)
    setTotalFilesSize(total)

  }

  const generate = (element) => {
    
    return  studentFiles ? studentFiles.map((file, i) => (
        cloneElement(element, {
          key: i,
          button: true,
          onClick: () => handleOpenFile(file.fullPath),
          size: file.metadata.size,
          name: file.name,
          onDelete: () => handleDeleteFile(file.fullPath),
        })

      )
        
    ) : (
      <ListItem>
        <ListItemAvatar>
          <Avatar>
            <FolderIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={'Nenhum arquivo encontrado.'}
          secondary={'Tente fazer o upload de arquivos do aluno. Eles aparecerão aqui.'}
        />
        
      </ListItem>
    )
      
  }

  const ListItemElem = (props) => {
    const { onClick, button, name, size, onDelete} = props;

    return (
      
      <ListItem button={button} onClick={onClick}>
        <ListItemAvatar>
          <Avatar>
            <FolderIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={name}
          secondary={secondary ? formatBytes(size) : null}
        />
        <ListItemSecondaryAction>
          <IconButton edge="end" aria-label="delete" onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    )
  }

  return (
    <div className={classes.root}>
      <ShowFiles open={openFile} url={url} onClose={handleCloseFile} />
      <Box m={1}>
          <Button onClick={() => {
            document.getElementById('uploadFiles').click()
            
          }} variant="outlined" size="small" color="primary" fullWidth startIcon={<CloudUpload />}>Enviar arquivos</Button>
        </Box>
        <Box m={1}>
          <Button onClick={() => {
            calculateTotalSize()
            setDense(!dense)
            
          }} variant="outlined" size="small" color="primary" fullWidth startIcon={<Refresh />}>Carregar arquivos</Button>
          <input type="file" name="uploadFiles" id="uploadFiles" multiple style={{display: 'none'}} onInput={handleUploadFile} />
        </Box>
      {/* <FormGroup row>
         <FormControlLabel
          control={
            <Checkbox checked={dense} onChange={(event) => setDense(event.target.checked)} />
          }
          label="Lista densa"
        /> 
        
        
      </FormGroup> */}
      <Grid container spacing={1}>
        
        <Grid item xs={12} md={12}>
          
          <div className={classes.demo}>
             
            <List dense={dense} className={classes.list}>
              {generate(
                <ListItemElem />
              )}
            </List>
              
            
          </div>
          <Typography color="textSecondary">
              Armazenamento utilizado: {totalFilesSize}
            </Typography>
        </Grid>
      </Grid>
    </div>
  );
}