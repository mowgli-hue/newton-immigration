export class GetDashboardUseCase {
  async execute(userId: string) {
    return {
      userId,
      message: 'Dashboard use case scaffolded'
    };
  }
}
