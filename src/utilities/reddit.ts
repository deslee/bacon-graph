import "reflect-metadata";
import { IsIn, IsArray, IsNumber, IsString, ValidateNested, IsNotEmpty, Matches } from 'class-validator'
import { transformAndValidate as transformAndValidate } from "class-transformer-validator";
import { Type } from 'class-transformer';

type Kind = 't1' | 't2' | 't3' | 't4' | 't5';

class BaseThing {
    @IsIn(['t1', 't2', 't3', 't4', 't5'])
    kind!: Kind
}

class AboutData {
    @IsString()
    @IsNotEmpty()
    description!: string;
}

class AboutResponse extends BaseThing {
    @Type(() => AboutData)
    @IsNotEmpty()
    @ValidateNested()
    data!: AboutData
}

export async function redirect_auth() {
    const REDIRECT_URL = 'http://localhost:3000';
    const DURATION = 'temporary';
    const SCOPE = 'read'
    const CLIENT_ID = 'suKcTgwxSPwcng'
    const randomString = Math.random().toString();
    const url = `https://www.reddit.com/api/v1/authorize?client_id=${CLIENT_ID}&response_type=token&state=${randomString}&redirect_uri=${REDIRECT_URL}&duration=${DURATION}&scope=${SCOPE}`
    window.location.href = url;
}

export type SubredditGraphNode = {
    name: string,
    children: SubredditGraphNode[]
}

export function fetchGraph(subreddit: string, maxDepth = 3) {
    return fetchGraphRecursive(subreddit, maxDepth, [], 0)
}

async function fetchGraphRecursive(subreddit: string, maxDepth: number, nodes: string[], currentDepth: number): Promise<SubredditGraphNode | undefined> {
    subreddit = subreddit.replace('/r/', '').replace(/\//g, '').toLowerCase();
    // console.log(subreddit, currentDepth, nodes);

    if (currentDepth >= maxDepth) {
        return;
    }

    if (nodes.indexOf(subreddit) !== -1) {
        return undefined;
    }

    const about = await fetchAbout(subreddit);

    const subredditsInDescription = [];

    const subredditRegex = /\/r\/\w(\w|\d|-|_)*/g;

    let m: RegExpExecArray | null = null;
    do {
        m = subredditRegex.exec(about.data.description);
        if (m && m.length) {
            const m0 = m[0].toLowerCase().replace('/r/', '')
            if (subredditsInDescription.indexOf(m0) === -1 && m0 !== subreddit) {
                subredditsInDescription.push(m0)
            }
        }
    } while (m);

    const relatedSubreddits = subredditsInDescription;
    nodes.push(subreddit)
    return {
        name: subreddit,
        children: (await Promise.all(relatedSubreddits.map(sub => fetchGraphRecursive(sub, maxDepth, nodes, currentDepth + 1)))).filter(n => n !== undefined) as SubredditGraphNode[]
    }
}

export async function fetchAbout(subreddit: string) {
    const result = await fetch(`https://oauth.reddit.com/r/${subreddit}/about.json`, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
    })

    if (result.status === 401) {
        sessionStorage.removeItem('token');
        redirect_auth();
    }

    const json = await result.json();
    try {
        const aboutResponse = await transformAndValidate(AboutResponse, json);
        return aboutResponse as AboutResponse;
    } catch (err) {
        console.log(err)
        throw err;
    }
}