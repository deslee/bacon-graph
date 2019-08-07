import React, { useRef } from 'react';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import { TextField, makeStyles, Button } from '@material-ui/core';
import { fetchGraph, redirect_auth, SubredditGraphNode } from './utilities/reddit';
import Tree from 'react-d3-tree';

const useStyles = makeStyles(theme => ({
  form: {
    padding: theme.spacing(3)
  }
}))


const App: React.FC = () => {
  const classes = useStyles()
  const inputEl = useRef<HTMLInputElement>();
  const [graph, setGraph] = React.useState<SubredditGraphNode | undefined>();
  const onSubmit = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputEl.current) {
      const graph = await fetchGraph(inputEl.current.value);
      setGraph(graph);
    }
  }, [])
  React.useEffect(() => {
    if (inputEl.current) {
      inputEl.current.value = 'webdev'
    }
    if (window.location.hash && window.location.hash.length) {
        const query = window.location.hash.substring(1).split('&').filter(s => s.indexOf('=') > 0).map(kvp => ({
            [kvp.split('=')[0]]: kvp.split('=')[1]
        })).reduce((pre, cur) => Object.assign(pre, cur), {})

        if (query.access_token) {
          sessionStorage.setItem('token', query.access_token)
        }

        window.location.hash = '';
    }
    const token = sessionStorage.getItem('token')

    if (!token) {
      redirect_auth();
    }
  }, [])
  return <>
    <CssBaseline />
    <Typography>haha</Typography>
    <form className={classes.form} onSubmit={onSubmit} >
      <TextField placeholder="subreddit" inputRef={inputEl} />
      <Button type="submit">Submit</Button>
    </form>
    {graph && <Tree data={graph} />}
  </>;
}

export default App;
