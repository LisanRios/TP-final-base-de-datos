export class ChatEntity {
    constructor(
        public text: string,
        public chart?: { type: 'line' | 'bar' | 'pie'; data: any[] }
    ) {}
}