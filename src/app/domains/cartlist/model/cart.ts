import { CategoryDto } from "src/app/model/category-dto";
import { UserDto } from "src/app/model/user-dto";

export interface Cart {
    id: number | null;
    title: string;
    description: string;
    amount: number;
    datePurchased: Date;
    groupId: number;
    userDto: UserDto;
    categoryDto: CategoryDto;
    deleted?: boolean;
}
