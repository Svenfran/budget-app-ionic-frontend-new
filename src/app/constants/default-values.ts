import { Group } from "../model/group";
import { GroupMembers } from '../groupmembers/model/groupmembers-dto';
import { RemoveMemberDto } from "../groupoverview/model/remove-member";

export enum INIT_VALUES {
    DEFAULT = "DEFAULT",
}

export class Init {
    public static DEFAULT_GROUP: Group = { id: 0, name: '', dateCreated: new Date(), flag: INIT_VALUES.DEFAULT };
    public static DEFAULT_GROUP_MEMBERS: GroupMembers = { id: 0, name: '', ownerName: '', ownerId: 0, members: [], flag: INIT_VALUES.DEFAULT };
}
