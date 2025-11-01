import { ChatResponseDTO } from "../dto/chat-response.dto";
import { ChartDataDTO } from "../dto/chart-data.dto";
import { ChatEntity } from "../domain/chat";

export class ChatMapper {
    static toDTO(entity: ChatEntity): ChatResponseDTO {
        const dto: ChatResponseDTO = { text: entity.text };
        if (entity.chart) {
            dto.chart = {
                type: entity.chart.type,
                data: entity.chart.data
            } as ChartDataDTO;
        }
        return dto;
    }

    static toEntity(dto: ChatResponseDTO | { text: string, chart?: any }): ChatEntity {
        return new ChatEntity(dto.text, dto.chart);
    }
}