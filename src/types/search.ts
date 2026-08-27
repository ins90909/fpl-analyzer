export interface SearchResultItem {
  entryId: number;
  entryName: string;
  playerFirstName: string;
  playerLastName: string;
}

export interface SearchApiResponse {
  results: SearchResultItem[];
}