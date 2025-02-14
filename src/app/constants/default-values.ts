import { Group } from "../model/group"

export enum GROUP {
    DEFAULT = "DEFAULT",
}

export class Init {
    public static DEFAULT_GROUP: Group = {id: new Date().getTime(), name: '', dateCreated: new Date(), flag: GROUP.DEFAULT}
}
