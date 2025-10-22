
import AdvertisementRenderer from "../advertisementbackground/AdvertisementBackground";
import Review from "../CustomerReview/Review";
import { FeaturedProducts } from "../FeaturedProducts/Featuredproducts";
import { Main } from "../Main/Main";


export function Index() {
    return (
        <div>
           
            <Main />
            <AdvertisementRenderer position="popup" type="background" />
            <FeaturedProducts />
            <Review />

        </div>
    );
}