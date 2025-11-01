export class ChatEntity {
    constructor(
        public text: string,
        public chart?: any,
        public indicators?: { name: string; value: number | string }[]
    ) {}
}