import { IMatchRepository } from '../../contracts/repositories/IMatchRepository';
import { Match } from '../../domain/entities/Match';

export class GetLiveMatches {
  constructor(private matchRepository: IMatchRepository) {}
  
  async execute(): Promise<Match[]> {
    return this.matchRepository.getLiveMatches();
  }
}
